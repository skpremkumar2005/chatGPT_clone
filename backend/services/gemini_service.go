package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

var geminiClient *genai.GenerativeModel

// InitGemini initializes the Gemini client.
// This should be called once when the application starts.
func InitGemini() {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable not set.")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Fatalf("Failed to create Gemini client: %v", err)
	}

	geminiClient = client.GenerativeModel("gemini-1.5-flash")
}

// GenerateResponse sends the chat history to the Gemini API and returns the AI's response.
// `history` is a slice of genai.Content, which includes past user and model messages.
func GenerateResponse(history []*genai.Content, newUserMessage string) (string, error) {
	if geminiClient == nil {
		return "", errors.New("Gemini client not initialized")
	}

	// Create a new chat session
	chat := geminiClient.StartChat()

	// Set the history for the chat session
	if len(history) > 0 {
		chat.History = history
	}

	// Send the new user message and get response
	ctx := context.Background()
	resp, err := chat.SendMessage(ctx, genai.Text(newUserMessage))
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	// Check if there are candidates and parts
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("received an empty response from Gemini API")
	}

	// Extract and return the text from the response
	if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(textPart), nil
	}

	return "", errors.New("no text part found in Gemini API response")
}
