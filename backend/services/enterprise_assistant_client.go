package services

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type enterpriseAssistantQueryRequest struct {
	CompanyID string `json:"company_id"`
	Message   string `json:"message"`
	TopK      int    `json:"top_k"`
}

type EnterpriseAssistantQueryResponse struct {
	Answer              string   `json:"answer"`
	ChunksUsed          int      `json:"chunks_used"`
	LLMUsed             bool     `json:"llm_used"`
	LLMError            *string  `json:"llm_error"`
	UsedDocumentContext bool     `json:"used_document_context"`
	BestSimilarity      *float64 `json:"best_similarity"`
}

type enterpriseAssistantDocumentRequest struct {
	CompanyID string `json:"company_id"`
	UserID    string `json:"user_id"`
	Filename  string `json:"filename,omitempty"`
	Text      string `json:"text"`
}

type EnterpriseAssistantDocumentResponse struct {
	DocumentID   string  `json:"document_id"`
	ChunksCreated int    `json:"chunks_created"`
	Summary      *string `json:"summary"`
}

var (
	enterpriseAssistantBaseURL string
	enterpriseAssistantDocumentsURL string
	enterpriseAssistantClient  *http.Client
)

func InitEnterpriseAssistantClient() {
	enterpriseAssistantBaseURL = os.Getenv("ENTERPRISE_ASSISTANT_URL")
	if enterpriseAssistantBaseURL == "" {
		enterpriseAssistantBaseURL = "http://localhost:8000"
	}
	enterpriseAssistantBaseURL = strings.TrimRight(enterpriseAssistantBaseURL, "/")

	enterpriseAssistantDocumentsURL = os.Getenv("ENTERPRISE_ASSISTANT_DOCUMENTS_URL")
	if enterpriseAssistantDocumentsURL == "" {
		enterpriseAssistantDocumentsURL = enterpriseAssistantBaseURL
	}
	enterpriseAssistantDocumentsURL = strings.TrimRight(enterpriseAssistantDocumentsURL, "/")

	// Create HTTP client with TLS configuration
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // For Cloudflare tunnels and self-signed certs
	}
	transport := &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	enterpriseAssistantClient = &http.Client{
		Timeout:   3600 * time.Second,
		Transport: transport,
	}
}

func QueryEnterpriseAssistant(companyID, message string, topK int) (*EnterpriseAssistantQueryResponse, error) {
	if enterpriseAssistantClient == nil {
		InitEnterpriseAssistantClient()
	}

	payload := enterpriseAssistantQueryRequest{
		CompanyID: companyID,
		Message:   message,
		TopK:      topK,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query payload: %w", err)
	}

	resp, err := enterpriseAssistantClient.Post(
		enterpriseAssistantBaseURL+"/api/v1/query",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call enterprise assistant query API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read enterprise assistant query response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("enterprise assistant query API returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result EnterpriseAssistantQueryResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse enterprise assistant query response: %w", err)
	}

	return &result, nil
}

func UploadDocumentToEnterpriseAssistant(companyID, userID, filename, text string) (*EnterpriseAssistantDocumentResponse, error) {
	if enterpriseAssistantClient == nil {
		InitEnterpriseAssistantClient()
	}

	payload := enterpriseAssistantDocumentRequest{
		CompanyID: companyID,
		UserID:    userID,
		Filename:  filename,
		Text:      text,
	}
//print payload for debugging
	fmt.Printf("Uploading document to Enterprise Assistant: %+v\n", payload)
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal document payload: %w", err)
	}

	resp, err := enterpriseAssistantClient.Post(
		enterpriseAssistantDocumentsURL+"/api/v1/documents",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		fmt.Printf("Error calling Enterprise Assistant document API: %v\n", err)
		return nil, fmt.Errorf("failed to call enterprise assistant document API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read enterprise assistant document response: %w", err)
	}

	fmt.Printf("Enterprise Assistant document upload response (status %d): %s\n", resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf(
			"enterprise assistant document API returned %d from %s: %s",
			resp.StatusCode,
			enterpriseAssistantDocumentsURL+"/api/v1/documents",
			string(respBody),
		)
	}

	var result EnterpriseAssistantDocumentResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse enterprise assistant document response: %w", err)
	}

	return &result, nil
}
