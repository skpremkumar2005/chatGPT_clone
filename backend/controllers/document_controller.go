package controllers

import (
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/models"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProcessDocumentInput struct {
	Action string `json:"action"` // "extract"
}

type documentProcessResult struct {
	Text string
	Err  error
}

func processDocumentInGoroutine(documentData []byte, mimeType string) (string, error) {
	resultChan := make(chan documentProcessResult, 1)

	go func() {
		processedText, processErr := services.ProcessDocument(documentData, mimeType, "extract")
		resultChan <- documentProcessResult{Text: strings.TrimSpace(processedText), Err: processErr}
	}()

	select {
	case processResult := <-resultChan:
		return processResult.Text, processResult.Err
	case <-time.After(60 * time.Second):
		return "", fmt.Errorf("document processing timed out")
	}
}

// UploadAndProcessDocument handles document upload and processing
func UploadAndProcessDocument(c echo.Context) error {
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	// Get the uploaded file
	file, err := c.FormFile("document")
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "No file uploaded")
	}

	// Validate file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024
	if file.Size > maxFileSize {
		return utils.ErrorResponse(c, http.StatusBadRequest, "File size exceeds 10MB limit")
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to read file")
	}
	defer src.Close()

	// Read file data
	fileData, err := io.ReadAll(src)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to read file data")
	}

	// Determine MIME type
	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	extractedText, err := processDocumentInGoroutine(fileData, mimeType)
	if err != nil {
		c.Logger().Error("Document processing failed:", err)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process document")
	}

	// Create attachment record (stores raw text internally, not shown to user)
	attachment := models.Attachment{
		ID:            primitive.NewObjectID(),
		Filename:      file.Filename,
		MimeType:      mimeType,
		Size:          file.Size,
		UploadedAt:    primitive.NewDateTimeFromTime(time.Now()),
		ProcessedData: extractedText,
	}

	// Save user message with attachment
	userMessage := &models.Message{
		ID:          primitive.NewObjectID(),
		ChatID:      chatID,
		Role:        "user",
		Content:     fmt.Sprintf("Uploaded document: %s", file.Filename),
		Timestamp:   primitive.NewDateTimeFromTime(time.Now()),
		Attachments: []models.Attachment{attachment},
	}
	_, err = services.SaveMessage(userMessage)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save message")
	}

	// Send extracted text to Gemini for a proper AI summary/analysis
	geminiPrompt := fmt.Sprintf(
		"The user uploaded a document named \"%s\". Here is the extracted content:\n\n%s\n\nPlease provide a concise summary of this document and highlight the key points.",
		file.Filename,
		extractedText,
	)

	aiResponseContent, aiErr := services.GenerateResponse(nil, geminiPrompt)
	if aiErr != nil {
		c.Logger().Warnf("Gemini summarization failed for document %s: %v — using fallback", file.Filename, aiErr)
		// Fallback: acknowledge the upload without dumping raw text
		aiResponseContent = fmt.Sprintf(
			"I've received and processed **%s**.\n\nThe document has been extracted successfully. You can now ask me questions about its content.",
			file.Filename,
		)
	}

	aiMessage := &models.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chatID,
		Role:      "assistant",
		Content:   aiResponseContent,
		Timestamp: primitive.NewDateTimeFromTime(time.Now()),
		ModelUsed: "gemini",
	}
	savedAIMessage, err := services.SaveMessage(aiMessage)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save AI response")
	}

	return utils.SuccessResponse(c, "Document processed successfully", map[string]interface{}{
		"user_message": userMessage,
		"ai_message":   savedAIMessage,
		"attachment":   attachment,
	})
}

// GetKnowledgeBaseDocuments lists all KB documents for the requesting company.
func GetKnowledgeBaseDocuments(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid company context")
	}

	docs, err := services.GetKnowledgeBaseDocuments(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch documents")
	}

	return utils.SuccessResponse(c, "Documents fetched successfully", docs)
}

// GetKnowledgeBaseDocumentContent returns the full extracted text of a single KB document.
func GetKnowledgeBaseDocumentContent(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid company context")
	}

	docID, err := primitive.ObjectIDFromHex(c.Param("doc_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid document ID")
	}

	doc, err := services.GetKnowledgeBaseDocumentByID(docID, companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Document not found")
	}

	return utils.SuccessResponse(c, "Document content fetched", doc)
}

// DeleteKnowledgeBaseDocument removes a KB document.
func DeleteKnowledgeBaseDocument(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid company context")
	}

	docID, err := primitive.ObjectIDFromHex(c.Param("doc_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid document ID")
	}

	if err := services.DeleteKnowledgeBaseDocument(docID, companyID); err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Document not found or already deleted")
	}

	return utils.SuccessResponse(c, "Document deleted successfully", nil)
}

// UploadKnowledgeBaseDocument handles KB upload in a dedicated module (not chat).
func UploadKnowledgeBaseDocument(c echo.Context) error {
	userID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user context")
	}
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid company context")
	}

	file, err := c.FormFile("document")
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "No file uploaded")
	}

	const maxFileSize = 10 * 1024 * 1024
	if file.Size > maxFileSize {
		return utils.ErrorResponse(c, http.StatusBadRequest, "File size exceeds 10MB limit")
	}

	src, err := file.Open()
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to read file")
	}
	defer src.Close()

	fileData, err := io.ReadAll(src)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to read file data")
	}

	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	prompt := "extract"

	textContent, extractErr := processDocumentInGoroutine(fileData, mimeType)
	if extractErr != nil {
		c.Logger().Error("Failed to extract text from document:", extractErr)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to extract text from document")
	}

	if textContent == "" {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Document content is empty after extraction")
	}

	pythonResp, err := services.UploadDocumentToEnterpriseAssistant(
		companyID.Hex(),
		userID.Hex(),
		file.Filename,
		textContent,
	)
	if err != nil {
		c.Logger().Error("Knowledge base upload to Python backend failed:", err)
		localDoc, saveErr := services.SaveKnowledgeBaseDocument(
			companyID,
			userID,
			file.Filename,
			mimeType,
			prompt,
			textContent,
			"pending_sync",
			err.Error(),
			"",
			0,
		)
		if saveErr != nil {
			c.Logger().Error("Failed to persist pending knowledge base document:", saveErr)
			return utils.ErrorResponse(c, http.StatusBadGateway, "Knowledge base upstream error: "+err.Error())
		}

		attachment := models.Attachment{
			ID:            primitive.NewObjectID(),
			Filename:      file.Filename,
			MimeType:      mimeType,
			Size:          file.Size,
			UploadedAt:    primitive.NewDateTimeFromTime(time.Now()),
			ProcessedData: "Stored locally as pending sync",
		}

		return utils.SuccessResponse(c, "Knowledge base saved locally; upstream sync pending", map[string]interface{}{
			"company_id":       companyID,
			"uploaded_by":      userID,
			"action":           prompt,
			"attachment":       attachment,
			"sync_status":      "pending_sync",
			"local_document":   localDoc,
			"upstream_message": err.Error(),
		})
	}

	_, saveErr := services.SaveKnowledgeBaseDocument(
		companyID,
		userID,
		file.Filename,
		mimeType,
		prompt,
		textContent,
		"synced",
		"",
		pythonResp.DocumentID,
		pythonResp.ChunksCreated,
	)
	if saveErr != nil {
		c.Logger().Warn("Knowledge base synced upstream but failed local save:", saveErr)
	}

	attachment := models.Attachment{
		ID:            primitive.NewObjectID(),
		Filename:      file.Filename,
		MimeType:      mimeType,
		Size:          file.Size,
		UploadedAt:    primitive.NewDateTimeFromTime(time.Now()),
		ProcessedData: "Indexed in enterprise knowledge base",
	}

	return utils.SuccessResponse(c, "Knowledge base document uploaded successfully", map[string]interface{}{
		"company_id":     companyID,
		"uploaded_by":    userID,
		"action":         prompt,
		"attachment":     attachment,
		"document_id":    pythonResp.DocumentID,
		"chunks_created": pythonResp.ChunksCreated,
		"summary":        pythonResp.Summary,
	})
}
