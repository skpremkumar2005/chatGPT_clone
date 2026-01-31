package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

var geminiClient *genai.Client
var geminiModel *genai.GenerativeModel

// SystemPrompt defines the enterprise assistant's role and capabilities
const SystemPrompt = `You are an Intelligent Enterprise Assistant for a large public sector organization. Your role is to help employees with:

1. **HR Policies**: Answer questions about leave policies, attendance, employee benefits, promotions, grievance redressal, etc.
2. **IT Support**: Help with common IT issues, password resets, software installations, network problems, email issues, etc.
3. **Company Events**: Provide information about upcoming events, celebrations, training sessions, and announcements.
4. **General Organizational Queries**: Assist with office locations, contact information, department details, and general workplace questions.

**Guidelines:**
- Be professional, helpful, and concise
- If you don't know something, acknowledge it and suggest contacting the relevant department
- Maintain confidentiality and data privacy
- For sensitive HR or IT issues, recommend contacting the appropriate department directly
- Provide structured, easy-to-read responses

Remember: You are here to enhance organizational efficiency and employee satisfaction.`

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

	geminiClient = client
	geminiModel = client.GenerativeModel("gemini-2.5-flash")

	// Set system instruction
	geminiModel.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(SystemPrompt)},
	}

	// Configure safety settings for enterprise use
	geminiModel.SafetySettings = []*genai.SafetySetting{
		{
			Category:  genai.HarmCategoryHarassment,
			Threshold: genai.HarmBlockMediumAndAbove,
		},
		{
			Category:  genai.HarmCategoryHateSpeech,
			Threshold: genai.HarmBlockMediumAndAbove,
		},
		{
			Category:  genai.HarmCategorySexuallyExplicit,
			Threshold: genai.HarmBlockMediumAndAbove,
		},
		{
			Category:  genai.HarmCategoryDangerousContent,
			Threshold: genai.HarmBlockMediumAndAbove,
		},
	}
}

// GenerateResponse sends the chat history to the Gemini API and returns the AI's response.
// `history` is a slice of genai.Content, which includes past user and model messages.
func GenerateResponse(history []*genai.Content, newUserMessage string) (string, error) {
	if geminiModel == nil {
		return "", errors.New("AI client not initialized")
	}

	// Create a new chat session with system instruction
	chat := geminiModel.StartChat()

	// Set history directly without modifying it
	chat.History = history

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

// ProcessDocument analyzes a document using Gemini's multimodal capabilities
func ProcessDocument(documentData []byte, mimeType string, prompt string) (string, error) {
	if geminiClient == nil {
		return "", errors.New("Gemini client not initialized")
	}

	ctx := context.Background()
	model := geminiClient.GenerativeModel("gemini-2.5-flash")

	// Create the prompt parts
	parts := []genai.Part{
		genai.Text(prompt),
		genai.Blob{
			MIMEType: mimeType,
			Data:     documentData,
		},
	}

	resp, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		return "", fmt.Errorf("failed to process document: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("received empty response from document processing")
	}

	if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(textPart), nil
	}

	return "", errors.New("no text response from document processing")
}

// FilterProfanity checks if the message contains bad language
// Returns filtered message and whether profanity was found
func FilterProfanity(message string) (string, bool) {
	// Dictionary of common profanity (expandable)
	profanityList := []string{
		"fuck", "shit", "damn", "hell", "ass", "bitch", "bastard",
		"dick", "pussy", "cock", "cunt", "whore", "slut",
		// Add more words as needed
	}

	messageLower := strings.ToLower(message)
	hasProfanity := false

	for _, word := range profanityList {
		if strings.Contains(messageLower, word) {
			hasProfanity = true
			// Replace profanity with asterisks
			replacement := strings.Repeat("*", len(word))
			message = strings.ReplaceAll(message, word, replacement)
			message = strings.ReplaceAll(message, strings.Title(word), replacement)
			message = strings.ReplaceAll(message, strings.ToUpper(word), replacement)
		}
	}

	return message, hasProfanity
}
