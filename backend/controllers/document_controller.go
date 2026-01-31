package controllers

import (
	"chatgpt-clone/backend/models"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProcessDocumentInput struct {
	Action string `json:"action"` // "summarize" or "extract"
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

	// Get processing action (default to summarize)
	action := c.FormValue("action")
	if action == "" {
		action = "summarize"
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

	// Create prompt based on action
	var prompt string
	switch action {
	case "summarize":
		prompt = "Please provide a comprehensive summary of this document. Focus on the key points, main topics, and important information."
	case "extract":
		prompt = "Please extract all important keywords, phrases, and key information from this document. Organize them in a structured format."
	default:
		prompt = "Please analyze this document and provide insights about its content."
	}

	// Process document with Gemini
	processedData, err := services.ProcessDocument(fileData, mimeType, prompt)
	if err != nil {
		c.Logger().Error("Document processing failed:", err)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process document")
	}

	// Create attachment record
	attachment := models.Attachment{
		ID:            primitive.NewObjectID(),
		Filename:      file.Filename,
		MimeType:      mimeType,
		Size:          file.Size,
		UploadedAt:    primitive.NewDateTimeFromTime(time.Now()),
		ProcessedData: processedData,
	}

	// Save user message with attachment
	userMessage := &models.Message{
		ID:          primitive.NewObjectID(),
		ChatID:      chatID,
		Role:        "user",
		Content:     fmt.Sprintf("Uploaded document: %s (Action: %s)", file.Filename, action),
		Timestamp:   primitive.NewDateTimeFromTime(time.Now()),
		Attachments: []models.Attachment{attachment},
	}
	_, err = services.SaveMessage(userMessage)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save message")
	}

	// Save AI response with processed data
	aiMessage := &models.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chatID,
		Role:      "assistant",
		Content:   processedData,
		Timestamp: primitive.NewDateTimeFromTime(time.Now()),
		ModelUsed: "gemini-2.5-flash",
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
