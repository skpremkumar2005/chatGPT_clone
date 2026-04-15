# 🎯 DETAILED CODE IMPLEMENTATION ROADMAP

## Quick Start: What to Do First

### Step 0: Environment Setup (5 minutes)

```bash
# 1. Ensure Python backend is running
cd Enterprise-Assistant-Backend
pip install -r requirements.txt
python main.py  # Should start on http://localhost:8000

# 2. Check health
curl http://localhost:8000/

# 3. Update .env
# DATABASE_URL=postgresql://...
# OPENROUTER_API_KEY=xxx
```

### Step 1: Create RAG Client (10 minutes)

Copy [rag_client.go from INTEGRATION_GUIDE.md]  
Save as: `backend/services/rag_client.go`

### Step 2: Modify Chat Controller (15 minutes)

Edit: `backend/controllers/chat_controller.go`  
Replace Gemini call with RAG Service call (see code below)

### Step 3: Initialize RAG Client (2 minutes)

Edit: `backend/main.go`  
Add: `services.InitRAGClient()`

### Step 4: Test Integration (5 minutes)

```bash
# Terminal 1: Start Python RAG
cd Enterprise-Assistant-Backend
python main.py

# Terminal 2: Start Go Backend
cd backend
go run main.go

# Terminal 3: Test with curl
curl -X POST http://localhost:8080/api/chats/xxx/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Sample message"}'
```

---

## 📋 Complete Implementation Details

### **PART 1: RAG Client Service**

**File:** `backend/services/rag_client.go`

```go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================================================
// Types for RAG Service Communication
// ============================================================================

// RAGQueryRequest represents the data we send to Python RAG service
type RAGQueryRequest struct {
	CompanyID   string           `json:"company_id"`   // Tenant isolation
	Message     string           `json:"message"`      // User's question
	ChatHistory []ChatHistoryItem `json:"chat_history"` // Previous messages
	TopK        int              `json:"top_k"`        // Number of docs to retrieve
}

// ChatHistoryItem represents a single message in the conversation
type ChatHistoryItem struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // Message text
}

// RAGQueryResponse represents the response from Python RAG service
type RAGQueryResponse struct {
	Answer       string            `json:"answer"`        // Generated answer
	UsedContext  bool              `json:"used_context"`  // Was context used?
	Sources      []DocumentSource  `json:"sources"`       // Documents used
	ModelUsed    string            `json:"model_used"`    // Which LLM was used
	Confidence   float64           `json:"confidence"`    // Confidence score (0-1)
	Error        string            `json:"error,omitempty"` // Error message if any
}

// DocumentSource represents a document chunk used in the response
type DocumentSource struct {
	DocumentID      string  `json:"document_id"`
	Filename        string  `json:"filename"`
	SimilarityScore float64 `json:"similarity_score"` // 0-1 relevance score
	ChunkText       string  `json:"chunk_text"`       // Actual text snippet
}

// ============================================================================
// RAG Client Initialization
// ============================================================================

var (
	ragHTTPClient *http.Client
	ragServiceURL string
)

// InitRAGClient initializes the HTTP client and URL for RAG service
func InitRAGClient() {
	// Get URL from environment variable
	ragServiceURL = os.Getenv("RAG_SERVICE_URL")
	if ragServiceURL == "" {
		ragServiceURL = "http://localhost:8000" // Default for local development
	}

	// Create HTTP client with 30-second timeout
	ragHTTPClient = &http.Client{
		Timeout: 30 * time.Second,
	}

	log.Println("✅ RAG Client initialized - URL:", ragServiceURL)
}

// ============================================================================
// Query RAG Service Function
// ============================================================================

// QueryRAGService sends a query to Python RAG service and returns the response
// This is the main function called from chat_controller.go
func QueryRAGService(
	companyID string, // Company ID for isolation
	message string, // User's current message
	history []*genai.Content, // Chat history from MongoDB
	topK int, // Number of documents to retrieve
) (*RAGQueryResponse, error) {

	// Check initialization
	if ragHTTPClient == nil {
		return nil, fmt.Errorf("RAG client not initialized - call InitRAGClient() first")
	}

	// Convert Gemini history format to simple format for RAG
	chatHistory := []ChatHistoryItem{}
	for _, item := range history {
		role := "user"
		if item.Role == "model" {
			role = "assistant"
		}

		// Extract text from genai.Part
		for _, part := range item.Parts {
			if text, ok := part.(genai.Text); ok {
				chatHistory = append(chatHistory, ChatHistoryItem{
					Role:    role,
					Content: string(text),
				})
				break // Take first text part only
			}
		}
	}

	// Build the request
	request := RAGQueryRequest{
		CompanyID:   companyID,
		Message:     message,
		ChatHistory: chatHistory,
		TopK:        topK,
	}

	// Convert to JSON
	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshall RAG request: %w", err)
	}

	// Make HTTP POST request to RAG service
	log.Printf("📤 Sending query to RAG service for company %s", companyID)

	resp, err := ragHTTPClient.Post(
		ragServiceURL+"/api/v1/query",
		"application/json",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("RAG service request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read RAG response: %w", err)
	}

	// Check HTTP status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("RAG service returned error status %d: %s", resp.StatusCode, string(responseBody))
	}

	// Parse JSON response
	var ragResponse RAGQueryResponse
	if err := json.Unmarshal(responseBody, &ragResponse); err != nil {
		return nil, fmt.Errorf("failed to parse RAG response: %w", err)
	}

	// Check if service reported an error
	if ragResponse.Error != "" {
		return nil, fmt.Errorf("RAG service error: %s", ragResponse.Error)
	}

	log.Printf("✅ RAG response received - Used context: %v, Sources: %d",
		ragResponse.UsedContext, len(ragResponse.Sources))

	return &ragResponse, nil
}

// ============================================================================
// Fallback to Gemini (if RAG fails)
// ============================================================================

// FallbackToGemini is called if RAG service fails
// Uses original Gemini API as backup
func FallbackToGemini(history []*genai.Content, message string) (string, error) {
	log.Println("⚠️ Using Gemini as fallback (RAG unavailable)")
	return GenerateResponse(history, message)
}

// ============================================================================
// Document Upload to RAG Service
// ============================================================================

type DocumentUploadRequest struct {
	CompanyID string `json:"company_id"`
	UserID    string `json:"user_id"`
	Filename  string `json:"filename"`
	Text      string `json:"text"`
}

type DocumentUploadResponse struct {
	DocumentID    string `json:"document_id"`
	ChunksCreated int    `json:"chunks_created"`
	Summary       string `json:"summary,omitempty"`
}

// UploadDocumentToRAG sends extracted document text to RAG service for indexing
func UploadDocumentToRAG(
	companyID string,
	userID string,
	filename string,
	content string,
) (*DocumentUploadResponse, error) {

	if ragHTTPClient == nil {
		return nil, fmt.Errorf("RAG client not initialized")
	}

	// Build request
	request := DocumentUploadRequest{
		CompanyID: companyID,
		UserID:    userID,
		Filename:  filename,
		Text:      content,
	}

	// Convert to JSON
	requestBody, _ := json.Marshal(request)

	log.Printf("📤 Uploading document to RAG: %s (company: %s)", filename, companyID)

	// Send to RAG service
	resp, err := ragHTTPClient.Post(
		ragServiceURL+"/api/v1/documents",
		"application/json",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("document upload failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var docResponse DocumentUploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&docResponse); err != nil {
		return nil, fmt.Errorf("failed to parse document response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("document upload failed with status %d", resp.StatusCode)
	}

	log.Printf("✅ Document uploaded - %d chunks created", docResponse.ChunksCreated)

	return &docResponse, nil
}
```

---

### **PART 2: Chat Controller Modifications**

**File:** `backend/controllers/chat_controller.go`

**Location:** Find the `CreateMessage` function (around line 65)

**Replace this section:**

```go
// 4. Call Gemini API
aiResponseContent, err := services.GenerateResponse(geminiHistory, input.Content)
if err != nil {
    fmt.Println("Gemini API Error:", err)
    return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get response from AI")
}
```

**With this:**

```go
// 4. Call RAG Service (checks company knowledge base first)
startRAGTime := time.Now()

ragResponse, err := services.QueryRAGService(
	companyID.Hex(),        // Company ID for isolation
	input.Content,          // User's message
	geminiHistory,          // Chat history
	5,                      // Top 5 most relevant documents
)

ragDuration := time.Since(startRAGTime).Seconds()
if ragDuration > 5.0 {
	c.Logger().Warnf("RAG service took %.2f seconds (slow)", ragDuration)
}

var aiResponseContent string
var ragSources []services.DocumentSource
var usedRAGContext bool

if err != nil {
	// RAG service failed - fallback to Gemini
	c.Logger().Warn("RAG service failed, falling back to Gemini:", err)

	var fallbackErr error
	aiResponseContent, fallbackErr = services.FallbackToGemini(geminiHistory, input.Content)
	if fallbackErr != nil {
		fmt.Println("Both RAG and Gemini failed:", fallbackErr)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get response from AI")
	}

	usedRAGContext = false
	// aiMessage will not have sources
} else {
	// RAG service succeeded
	aiResponseContent = ragResponse.Answer
	ragSources = ragResponse.Sources
	usedRAGContext = ragResponse.UsedContext

	c.Logger().Infof("RAG used context: %v, Model: %s, Sources: %d",
		usedRAGContext, ragResponse.ModelUsed, len(ragSources))
}
```

**Then update the response saving (around line 175):**

Find:

```go
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
```

Replace with:

```go
// 5. Save the AI's response
modelUsed := "gemini-2.5-flash"  // Default fallback
if ragResponse != nil {
	modelUsed = ragResponse.ModelUsed
}

aiMessage := &models.Message{
	ID:           primitive.NewObjectID(),
	ChatID:       chatID,
	Role:         "assistant",
	Content:      aiResponseContent,
	Timestamp:    primitive.NewDateTimeFromTime(time.Now()),
	ModelUsed:    modelUsed,
	ResponseTime: responseTime,
}

savedAIMessage, err := services.SaveMessage(aiMessage)
if err != nil {
	return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save AI response")
}

// 6. Return the new AI message to the frontend WITH SOURCES
responseData := map[string]interface{}{
	"message": savedAIMessage,
}

// Include sources if RAG was used
if usedRAGContext && len(ragSources) > 0 {
	responseData["sources"] = ragSources
	responseData["used_context"] = true
} else {
	responseData["used_context"] = false
}

return utils.SuccessResponse(c, "Message processed successfully", responseData)
```

---

### **PART 3: Update main.go**

**File:** `backend/main.go`

Find the `init` section (around line 18-32):

```go
func main() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ .env file not found, using environment variables")
	}

	// Connect to database
	config.ConnectDB()

	// Initialize services
	services.Init()
```

Add after `services.Init()`:

```go
	// Initialize RAG Client (for knowledge base queries)
	services.InitRAGClient()

	// Keep Gemini init for fallback
	services.InitGemini()
```

---

### **PART 4: Update .env**

**File:** `backend/.env`

Add these lines:

```env
# RAG Service Configuration
RAG_SERVICE_URL=http://localhost:8000

# Keep Gemini as fallback (optional - can remove later)
GEMINI_API_KEY=your_gemini_key_here

# Other existing config...
MONGODB_URI=mongodb://...
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret
```

---

### **PART 5: Document Upload Integration (Optional - Phase 2)**

**File:** `backend/services/document_service.go` (NEW FILE)

```go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

// ExtractTextAndUpload extracts text from binary document and uploads to RAG
func ExtractTextAndUpload(
	companyID string,
	userID string,
	filename string,
	fileData []byte,
	mimeType string,
) (string, int, error) {

	// Step 1: Extract text based on file type
	extractedText, err := ExtractDocumentText(fileData, mimeType)
	if err != nil {
		return "", 0, fmt.Errorf("text extraction failed: %w", err)
	}

	// Step 2: Upload to RAG service
	docResponse, err := UploadDocumentToRAG(
		companyID,
		userID,
		filename,
		extractedText,
	)
	if err != nil {
		return "", 0, fmt.Errorf("RAG upload failed: %w", err)
	}

	return docResponse.DocumentID, docResponse.ChunksCreated, nil
}

// ExtractDocumentText extracts text from binary document
func ExtractDocumentText(fileData []byte, mimeType string) (string, error) {
	// For now, handle simple text files
	// In production, use libraries like:
	// - pdfplumber/pypdf for PDF
	// - python-docx for DOCX
	// - etc.

	switch mimeType {
	case "text/plain", "text/plain; charset=utf-8":
		return string(fileData), nil
	case "application/pdf":
		// TODO: Implement PDF extraction
		// Use github.com/pdfcpu/pdfcpu or similar
		return "", fmt.Errorf("PDF extraction not yet implemented - send raw text for now")
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		// TODO: Implement DOCX extraction
		return "", fmt.Errorf("DOCX extraction not yet implemented - send raw text for now")
	default:
		return "", fmt.Errorf("unsupported file type: %s", mimeType)
	}
}
```

---

## 🧪 Testing Commands

### **Test 1: Health Check**

```bash
# Check if RAG service is running
curl http://localhost:8000/
# Should return: {"status": "ok"}
```

### **Test 2: Upload Document to RAG**

```bash
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company-1",
    "user_id": "test-user-1",
    "filename": "employee_handbook.txt",
    "text": "Our company has a 20-day annual leave policy. Remote work is allowed 2 days per week. Health insurance covers employees and their families."
  }'
```

### **Test 3: Query RAG Service**

```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company-1",
    "message": "How many days of leave do we get?",
    "chat_history": [],
    "top_k": 5
  }'
```

### **Test 4: Full Backend Integration**

```bash
# Start RAG service
cd Enterprise-Assistant-Backend
python main.py
# Should see: "Uvicorn running on http://0.0.0.0:8000"

# In another terminal, upload document
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "507f1f77bcf86cd799439011",
    "user_id": "test-user",
    "filename": "company_policy.txt",
    "text": "Leave Policy: 20 days annual leave, can carry over 5 days to next year"
  }'

# Note the document_id from response

# Start Go backend
cd backend
go run main.go
# Should see: "✅ RAG Client initialized - URL: http://localhost:8000"

# Create a chat and send message (requires auth token)
curl -X POST http://localhost:8080/api/chats/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is our leave policy?"}'

# Should see sources in response
```

---

## 🐛 Debugging Tips

### **Debug 1: Check RAG Service Logs**

```bash
# In Python terminal
# Will show embeddings being generated, queries being processed
python main.py  # Watch console output
```

### **Debug 2: Check Go Backend Logs**

```bash
# In Go terminal
# Add debug logging:
c.Logger().Infof("RAG Response: %+v", ragResponse)
```

### **Debug 3: Verify Company Isolation**

```bash
# Login as user from Company A
# Upload doc to Company A
# Login as user from Company B
# Query - should NOT see Company A's docs

# Check PostgreSQL directly:
psql postgresql://user:pass@localhost:5432/rag_db
SELECT company_id, COUNT(*) FROM document_chunks GROUP BY company_id;
```

### **Debug 4: Check Vector Embeddings**

```bash
# In Python:
SELECT company_id, COUNT(*) as total_embeddings
FROM document_chunks
WHERE embedding IS NOT NULL
GROUP BY company_id;
```

---

## ⏱️ Performance Optimization

### **Slow Vector Search?**

Add index to PostgreSQL:

```sql
CREATE INDEX idx_embedding_cosine ON document_chunks
USING ivfflat (embedding vector_cosine_ops);
```

### **Slow Chat Response?**

Profile where time is spent:

```go
// Add timing logs
start := time.Now()
// ... operation ...
log.Printf("Operation took: %v", time.Since(start))
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] RAG client file created and compiles
- [ ] Chat controller calls RAG service instead of Gemini
- [ ] Sources appear in response JSON
- [ ] Fallback to Gemini works if RAG fails
- [ ] Company_id properly isolated in queries
- [ ] Document upload creates chunks in PostgreSQL
- [ ] Embeddings generated for chunks
- [ ] Frontend receives and displays sources
- [ ] Load testing shows < 5 second response
- [ ] No data leakage between companies

---

**Total Implementation Time: 45 minutes - 1 hour**

Ready to start? Begin with Part 1 (rag_client.go)
