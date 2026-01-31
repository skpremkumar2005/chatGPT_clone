package controllers

import (
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/models"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"fmt"
	"net/http"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// --- Input Structs ---

type CreateChatInput struct {
	Title string `json:"title"`
}

type CreateMessageInput struct {
	Content string `json:"content" validate:"required"`
}

type UpdateChatInput struct {
	Title string `json:"title" validate:"required"`
}

// --- Controller Functions ---

// CreateChat creates a new chat session.
func CreateChat(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)

	var input CreateChatInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}

	title := input.Title
	if title == "" {
		title = "New Chat" // A clean default title
	}

	chat, err := services.CreateNewChat(userID, title)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create chat")
	}

	return utils.SuccessResponse(c, "Chat created successfully", chat)
}

// GetChats retrieves all of a user's non-archived chats.
func GetChats(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)

	chats, err := services.GetUserChats(userID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch chats")
	}

	return utils.SuccessResponse(c, "Chats fetched successfully", chats)
}

// CreateMessage sends a message, gets a response from Gemini, and saves both.
// It also handles setting the chat title from the first message.
func CreateMessage(c echo.Context) error {
	startTime := time.Now() // Track response time

	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	var input CreateMessageInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Filter profanity from user input
	filteredContent, hasProfanity := services.FilterProfanity(input.Content)
	if hasProfanity {
		c.Logger().Warn("Profanity detected and filtered in message")
	}
	input.Content = filteredContent

	// Check if this is the first message to set the chat title.
	messageCount, err := services.CountMessagesInChat(chatID)
	if err != nil {
		c.Logger().Error("Failed to count messages for title update:", err)
		// Don't block the request; sending the message is more important.
	}

	if messageCount == 0 && input.Content != "" {
		const maxTitleLength = 50
		title := input.Content
		if len(title) > maxTitleLength {
			// Safely truncate to handle multi-byte characters
			title = string([]rune(title)[:maxTitleLength])
		}

		err := services.UpdateChatTitle(chatID, title)
		if err != nil {
			c.Logger().Error("Failed to auto-update chat title:", err)
			// Log the error but continue.
		}
	}

	// 1. Save the user's message
	userMessage := &models.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chatID,
		Role:      "user",
		Content:   input.Content,
		Timestamp: primitive.NewDateTimeFromTime(time.Now()),
	}
	_, err = services.SaveMessage(userMessage)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save user message")
	}

	// 2. Get chat history for Gemini context
	history, err := services.GetChatMessages(chatID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve chat history")
	}

	// 3. Format history for the Gemini API
	geminiHistory := []*genai.Content{}
	for _, msg := range history {
		role := "user"
		if msg.Role == "assistant" {
			role = "model"
		}
		geminiHistory = append(geminiHistory, &genai.Content{
			Parts: []genai.Part{genai.Text(msg.Content)},
			Role:  role,
		})
	}

	// 4. Call Gemini API
	aiResponseContent, err := services.GenerateResponse(geminiHistory, input.Content)
	if err != nil {
		fmt.Println("Gemini API Error:", err)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get response from AI")
	}

	// Calculate response time
	responseTime := time.Since(startTime).Seconds()
	if responseTime > 5.0 {
		c.Logger().Warnf("Response time exceeded 5 seconds: %.2fs", responseTime)
	}

	// 5. Save the AI's response
	aiMessage := &models.Message{
		ID:           primitive.NewObjectID(),
		ChatID:       chatID,
		Role:         "assistant",
		Content:      aiResponseContent,
		Timestamp:    primitive.NewDateTimeFromTime(time.Now()),
		ModelUsed:    "gemini-1.5-flash",
		ResponseTime: responseTime,
	}
	savedAIMessage, err := services.SaveMessage(aiMessage)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save AI response")
	}

	// 6. Return the new AI message to the frontend
	return utils.SuccessResponse(c, "Message processed successfully", savedAIMessage)
}

// GetMessages retrieves all messages for a specific chat.
func GetMessages(c echo.Context) error {
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	messages, err := services.GetChatMessages(chatID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch messages")
	}

	return utils.SuccessResponse(c, "Messages fetched successfully", messages)
}

// GetChatByID retrieves a specific chat by its ID after verifying ownership.
func GetChatByID(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	chat, err := services.GetChatByID(chatID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
	}

	if chat.UserID != userID {
		return utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized to access this chat")
	}

	return utils.SuccessResponse(c, "Chat fetched successfully", chat)
}

// UpdateChat handles manually renaming a chat.
func UpdateChat(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	var input UpdateChatInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Security check: Verify the chat belongs to the current user before updating.
	chat, err := services.GetChatByID(chatID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
	}
	if chat.UserID != userID {
		return utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized to update this chat")
	}

	if err := services.UpdateChatTitle(chatID, input.Title); err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update chat title")
	}

	return utils.SuccessResponse(c, "Chat updated successfully", nil)
}

// DeleteChat handles manually deleting a chat.
func DeleteChat(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	// Security check: Verify the chat belongs to the current user before deleting.
	chat, err := services.GetChatByID(chatID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
	}
	if chat.UserID != userID {
		return utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized to delete this chat")
	}

	if err := services.DeleteChat(chatID); err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete chat")
	}

	return utils.SuccessResponse(c, "Chat deleted successfully", nil)
}

// CleanupChat handles the request to check and potentially delete an empty chat.
func CleanupChat(c echo.Context) error {
	userID := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	chatID, err := primitive.ObjectIDFromHex(c.Param("chat_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
	}

	// Security check: Verify ownership before cleaning up.
	chat, err := services.GetChatByID(chatID)
	if err != nil {
		// If chat not found, it might have already been deleted, which is fine.
		return utils.SuccessResponse(c, "Chat not found, assumed cleaned up", nil)
	}
	if chat.UserID != userID {
		return utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized to clean up this chat")
	}

	if err := services.CleanupEmptyChat(chatID); err != nil {
		c.Logger().Error("Failed to cleanup chat:", err)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Error during chat cleanup")
	}

	return utils.SuccessResponse(c, "Chat cleanup processed successfully", nil)
}

// DeleteMessage is a placeholder for future implementation.
func DeleteMessage(c echo.Context) error {
	return utils.SuccessResponse(c, "Endpoint not yet implemented", nil)
}
