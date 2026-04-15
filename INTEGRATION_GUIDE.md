# 🔧 INTEGRATION IMPLEMENTATION GUIDE

## Quick Reference

This guide provides step-by-step implementation instructions to connect all three services with company-specific knowledge bases.

---

## 📏 Architecture Visualization

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER BROWSER (Frontend)                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ React App                                                   │  │
│  │ - Chat UI (sends messages)                                  │  │
│  │ - Document Upload (uploads company docs)                   │  │
│  │ - Chat History + Sources Display                           │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         ↑                                      ↑
    API Calls                          Document Upload
         │                                      │
    ┌────▼──────────────────────────────────────▼─────────────────┐
    │              GO BACKEND (Port 8080)                          │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
    │  ┃ AUTHENTICATION & ORCHESTRATION                         ┃  │
    │  ┃ - JWT Middleware (Extract user + company_id)          ┃  │
    │  ┃ - MongoDB (Store chats, messages, users)              ┃  │
    │  ┃ - Activity Logging                                     ┃  │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
    │                                                             │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
    │  ┃ NEW: RAG CLIENT (rag_client.go)                       ┃  │
    │  ┃ - Call Python RAG Service                             ┃  │
    │  ┃ - Pass company_id + message + history                 ┃  │
    │  ┃ - Receive augmented response + sources                ┃  │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
    │                                                             │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
    │  ┃ NEW: DOCUMENT HANDLER                                  ┃  │
    │  ┃ - Receive document upload                              ┃  │
    │  ┃ - Forward to Python backend                            ┃  │
    │  ┃ - Track processing status                              ┃  │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
    │                                                             │
    └──────────────────────────────────────────────────────────────┘
         ↑                                      ↑
    HTTP Calls                          Document Upload
         │                                      │
    ┌────▼──────────────────────────────────────▼─────────────────┐
    │       PYTHON RAG SERVICE (Port 8000)                         │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
    │  ┃ DOCUMENT MANAGEMENT                                    ┃  │
    │  ┃ - FastAPI endpoints for docs                           ┃  │
    │  ┃ - Store with company_id isolation                      ┃  │
    │  ┃ - PostgreSQL (documents + chunks)                      ┃  │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
    │                                                             │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
    │  ┃ VECTOR EMBEDDINGS & SEARCH                             ┃  │
    │  ┃ - Generate embeddings (OpenRouter)                     ┃  │
    │  ┃ - Store in pgvector (PostgreSQL)                       ┃  │
    │  ┃ - Cosine similarity search                             ┃  │
    │  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  │
    │  ┃ RAG QUERY PROCESSING (query_routes.py)                 ┃  │
    │  ┃ 1. Receive: company_id + message                       ┃  │
    │  ┃ 2. Generate query embedding                            ┃  │
    │  ┃ 3. Find similar chunks (company_id filtered)           ┃  │
    │  ┃ 4. Send top_k chunks + message to LLM                  ┃  │
    │  ┃ 5. Return: answer + sources + confidence               ┃  │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
    │                                                             │
    └──────────────────────────────────────────────────────────────┘
         ↑
    LLM API Calls
         │
    ┌────▼───────────────────────────────────────────────────────┐
    │          OpenRouter API (Multi-LLM Provider)               │
    │  - Claude 3.5 Sonnet                                       │
    │  - GPT-4                                                   │
    │  - Llama 2                                                 │
    │  - Embeddings Model                                        │
    └───────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 1: Backend Integration (Most Critical)

### **Goal:** Replace Gemini API with RAG Service

### **File 1: Create `backend/services/rag_client.go`**

This service will handle all communication with the Python RAG service.

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

// RAG Service Types
type RAGQueryRequest struct {
	CompanyID   string                 `json:"company_id"`
	Message     string                 `json:"message"`
	ChatHistory []ChatHistoryItem      `json:"chat_history"`
	TopK        int                    `json:"top_k"`
}

type ChatHistoryItem struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type RAGQueryResponse struct {
	Answer       string         `json:"answer"`
	UsedContext  bool           `json:"used_context"`
	Sources      []DocumentSource `json:"sources"`
	ModelUsed    string         `json:"model_used"`
	Confidence   float64        `json:"confidence"`
	Error        string         `json:"error,omitempty"`
}

type DocumentSource struct {
	DocumentID      string  `json:"document_id"`
	Filename        string  `json:"filename"`
	SimilarityScore float64 `json:"similarity_score"`
	ChunkText       string  `json:"chunk_text"`
}

var ragClient *http.Client
var ragServiceURL string

func InitRAGClient() {
	ragServiceURL = os.Getenv("RAG_SERVICE_URL")
	if ragServiceURL == "" {
		ragServiceURL = "http://localhost:8000" // fallback for local dev
	}

	ragClient = &http.Client{
		Timeout: 30 * time.Second,
	}

	log.Println("✅ RAG Service initialized:", ragServiceURL)
}

// QueryRAGService sends a query to the RAG service and returns the response
func QueryRAGService(companyID, message string, history []*genai.Content, topK int) (*RAGQueryResponse, error) {
	if ragClient == nil {
		return nil, fmt.Errorf("RAG client not initialized")
	}

	// Convert genai.Content to ChatHistoryItem
	chatHistory := []ChatHistoryItem{}
	for _, item := range history {
		role := "user"
		if item.Role == "model" {
			role = "assistant"
		}
		// Extract text from parts
		if len(item.Parts) > 0 {
			if text, ok := item.Parts[0].(genai.Text); ok {
				chatHistory = append(chatHistory, ChatHistoryItem{
					Role:    role,
					Content: string(text),
				})
			}
		}
	}

	// Create request
	request := RAGQueryRequest{
		CompanyID:   companyID,
		Message:     message,
		ChatHistory: chatHistory,
		TopK:        topK,
	}

	// Marshal to JSON
	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Call RAG Service
	resp, err := ragClient.Post(
		ragServiceURL+"/api/v1/query",
		"application/json",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("RAG service request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read RAG response: %w", err)
	}

	// Parse response
	var ragResponse RAGQueryResponse
	if err := json.Unmarshal(responseBody, &ragResponse); err != nil {
		return nil, fmt.Errorf("failed to parse RAG response: %w", err)
	}

	// Check for service errors
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("RAG service error: %s", ragResponse.Error)
	}

	return &ragResponse, nil
}

// SaveMessageWithSources saves a message along with the sources used
func SaveMessageWithRAGSources(message *Message, sources []DocumentSource) error {
	// If you want to track sources with messages, add to the Message model
	// For now, storing just the message as before
	_, err := SaveMessage(message)
	return err
}
```

### **File 2: Modify `backend/controllers/chat_controller.go`**

Replace the Gemini call with RAG service call.

**Find the `CreateMessage` function (around line 65) and modify:**

From:

```go
// 4. Call Gemini API
aiResponseContent, err := services.GenerateResponse(geminiHistory, input.Content)
if err != nil {
	fmt.Println("Gemini API Error:", err)
	return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get response from AI")
}
```

To:

```go
// 4. Call RAG Service (with company knowledge base)
ragResponse, err := services.QueryRAGService(
	companyID.Hex(),
	input.Content,
	geminiHistory,
	5, // top_k documents
)
if err != nil {
	// Fallback to Gemini if RAG fails
	c.Logger().Warn("RAG service failed, falling back to direct Gemini:", err)
	aiResponseContent, err = services.GenerateResponse(geminiHistory, input.Content)
	if err != nil {
		fmt.Println("Gemini API Error:", err)
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get response from AI")
	}
	ragResponse = &services.RAGQueryResponse{
		Answer:       aiResponseContent,
		UsedContext:  false,
		ModelUsed:    "gemini-2.5-flash",
	}
} else {
	aiResponseContent = ragResponse.Answer
}
```

Then update the response part:

```go
// 5. Save the AI's response with metadata
aiMessage := &models.Message{
	ID:           primitive.NewObjectID(),
	ChatID:       chatID,
	Role:         "assistant",
	Content:      aiResponseContent,
	Timestamp:    primitive.NewDateTimeFromTime(time.Now()),
	ModelUsed:    ragResponse.ModelUsed,
	ResponseTime: responseTime,
}

// Add sources as a custom field (optional - requires model update)
// aiMessage.Sources = ragResponse.Sources

savedAIMessage, err := services.SaveMessage(aiMessage)
if err != nil {
	return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save AI response")
}

// Return with sources in response
response := map[string]interface{}{
	"message": savedAIMessage,
	"sources": ragResponse.Sources,
	"used_context": ragResponse.UsedContext,
}

return c.JSON(http.StatusOK, map[string]interface{}{
	"success": true,
	"message": "Message processed successfully",
	"data":    response,
})
```

### **File 3: Update `backend/main.go`**

Initialize RAG client on startup:

```go
// After config.ConnectDB()
services.InitGemini()  // KEEP if fallback needed
services.InitRAGClient() // NEW
```

### **File 4: Update `.env` / Environment Configuration**

Add:

```env
RAG_SERVICE_URL=http://localhost:8000
# KEEP FOR FALLBACK:
GEMINI_API_KEY=xxxxx
```

---

## 🎯 Phase 2: Python RAG Service Enhancements

### **Current Status:** Python RAG service is already well-built with company isolation!

### **Just verify these are in place:**

1. **Database URL in `.env`:**

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/rag_db
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   EMBEDDING_MODEL=openrouter/embedding-model
   LLM_MODEL=openrouter/claude-3.5-sonnet
   ```

2. **Run migrations:**

   ```bash
   cd Enterprise-Assistant-Backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Test endpoint:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{
       "company_id": "test-company",
       "message": "What is the leave policy?",
       "chat_history": [],
       "top_k": 5
     }'
   ```

---

## 🎯 Phase 3: Document Upload Bridge

### **File: Create `backend/services/document_service.go`**

```go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

type DocumentUploadRequest struct {
	CompanyID string `json:"company_id"`
	UserID    string `json:"user_id"`
	Filename  string `json:"filename"`
	Text      string `json:"text"`
}

type DocumentUploadResponse struct {
	DocumentID   string `json:"document_id"`
	ChunksCreated int   `json:"chunks_created"`
	Summary      string `json:"summary"`
}

var documentServiceURL string

func InitDocumentService() {
	documentServiceURL = os.Getenv("RAG_SERVICE_URL")
	if documentServiceURL == "" {
		documentServiceURL = "http://localhost:8000"
	}
}

// UploadDocumentToRAG sends a document to the RAG service
func UploadDocumentToRAG(companyID, userID, filename, content string) (*DocumentUploadResponse, error) {
	request := DocumentUploadRequest{
		CompanyID: companyID,
		UserID:    userID,
		Filename:  filename,
		Text:      content,
	}

	requestBody, _ := json.Marshal(request)

	resp, err := ragClient.Post(
		documentServiceURL+"/api/v1/documents",
		"application/json",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("document upload failed: %w", err)
	}
	defer resp.Body.Close()

	var docResponse DocumentUploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&docResponse); err != nil {
		return nil, fmt.Errorf("failed to parse document response: %w", err)
	}

	return &docResponse, nil
}
```

### **File: Modify `backend/controllers/document_controller.go`**

After successfully reading the document:

```go
// After extracting text from PDF/DOCX
// Upload to RAG service
docResponse, err := services.UploadDocumentToRAG(
	companyID.Hex(),
	userID.Hex(),
	file.Filename,
	extractedText,
)

if err != nil {
	c.Logger().Warn("Document not sent to RAG service:", err)
	// Don't fail - document is still available in MongoDB
	// But RAG service won't have it
} else {
	c.Logger().Info(fmt.Sprintf("Document uploaded to RAG: %d chunks created", docResponse.ChunksCreated))
}
```

---

## 🎯 Phase 4: Frontend Integration

### **File: Update `frontend/src/services/chatAPI.js`**

Add functions to retrieve sources:

```javascript
// Get sources for a message
export const getMessageSources = (messageId) => {
  return api.get(`/messages/${messageId}/sources`);
};

// Upload document
export const uploadDocument = (chatId, file, action = "add_to_kb") => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("action", action);
  formData.append("chat_id", chatId);

  return api.post(`/chats/${chatId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
```

### **File: Update `frontend/src/components/Chat/Message.jsx`**

Display sources in messages:

```jsx
// After message content
{
  message.sources && message.sources.length > 0 && (
    <div className="sources-used">
      <details>
        <summary>📚 Sources Used ({message.sources.length})</summary>
        <div className="sources-list">
          {message.sources.map((source, idx) => (
            <div key={idx} className="source-item">
              <span className="source-filename">{source.filename} </span>
              <span className="similarity-score">
                ({(source.similarity_score * 100).toFixed(0)}% match)
              </span>
              <p className="source-text">
                {source.chunk_text.substring(0, 150)}...
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
```

---

## ✅ Testing Checklist

### **Test 1: Single Service**

```bash
# Start Python RAG service
cd Enterprise-Assistant-Backend
python main.py

# Test document upload
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company-1",
    "user_id": "test-user-1",
    "filename": "policies.txt",
    "text": "Our leave policy: 20 days annual leave..."
  }'
```

### **Test 2: Query RAG Service**

```bash
# Query with company isolation
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company-1",
    "message": "How many days leave?",
    "chat_history": [],
    "top_k": 5
  }'
```

### **Test 3: Full Integration**

1. Start Go backend
2. Start Python RAG service
3. Login from frontend
4. Upload document
5. Send message
6. ✅ Should get answer with sources

### **Test 4: Company Isolation**

1. Create User in Company A
2. Upload documents to Company A's knowledge base
3. Login as User in Company B
4. Try querying
5. ✅ Should NOT see Company A's documents

---

## 📊 Database Schemas

### **Go Backend (MongoDB)**

Document structure after integration:

```javascript
{
  _id: ObjectId("..."),
  company_id: ObjectId("..."),  // Company isolation
  user_id: ObjectId("..."),
  title: "Leave Policy Discussion",
  created_at: ISODate("..."),
  updated_at: ISODate("..."),
  is_archived: false
}
```

Message with sources:

```javascript
{
  _id: ObjectId("..."),
  chat_id: ObjectId("..."),
  role: "assistant",
  content: "Answer text...",
  timestamp: ISODate("..."),
  model_used: "openrouter/claude-3.5-sonnet",
  response_time: 2.345,
  sources: [
    {
      document_id: "uuid-...",
      filename: "policies.pdf",
      similarity_score: 0.92,
      chunk_text: "..."
    }
  ]
}
```

### **Python RAG (PostgreSQL)**

```sql
-- Company-isolated documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,  -- Company isolation key
  user_id VARCHAR(255),
  filename VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chunks with embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,  -- CRITICAL: Same as document
  document_id UUID NOT NULL,
  chunk_index INT,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),  -- pgvector extension
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Index for fast company_id + similarity search
CREATE INDEX idx_chunks_company ON document_chunks(company_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: RAG Service Timeout**

**Solution:** Increase timeout in `rag_client.go`

```go
ragClient = &http.Client{
	Timeout: 60 * time.Second,  // Increase from 30
}
```

### **Issue 2: Embeddings Generation Slow**

**Solution:** Cache embeddings or use lightweight models

```python
# In embeddings.py
@lru_cache(maxsize=1000)  # Cache embeddings
def generate_embedding(text: str):
    ...
```

### **Issue 3: Cross-Company Data Leak**

**Solution:** ALWAYS filter by company_id in Python queries

```python
chunks = db.query(DocumentChunk).filter(
    DocumentChunk.company_id == payload.company_id  # ← CRITICAL
).all()
```

### **Issue 4: Gemini vs OpenRouter**

**Solution:** Use OpenRouter for consistency

- OpenRouter supports multiple models
- Easier to switch providers
- Lower cost via aggregation

---

## 🎉 Success Criteria

After implementation:

✅ **Message Flow:**

- User sends message
- Go backend receives it
- Go backend calls Python RAG service with company_id
- Python RAG returns augmented response
- Response shows sources used
- Message saved with source metadata

✅ **Company Isolation:**

- Company A uploads "Payroll.pdf"
- Company B cannot access it
- Even via RAG queries
- Verified by company_id filters in DB

✅ **Document Management:**

- Upload documents per company
- Automatic chunking & embedding
- Searchable by semantic similarity
- Cost-optimized with relevant context

✅ **Performance:**

- RAG query < 5 seconds
- Embedding generation < 2 seconds
- No timeout failures

---

**Next Steps:** Start with Phase 1, then test before moving to Phase 2-4
