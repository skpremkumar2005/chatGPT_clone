# ChatGPT Clone - Complete Project Architecture Analysis

## 📊 Project Overview

This is a **Multi-Tenant Enterprise Assistant** with three main services:

1. **Backend (Go)** - Main API & Authentication
2. **Enterprise-Assistant-Backend (Python)** - RAG (Retrieval-Augmented Generation) Service
3. **Frontend (React)** - User Interface

---

## 🏗️ Architecture Breakdown

### **1. BACKEND (Go) - Primary API Server**

**Purpose:** Handle core business logic, authentication, user management, company management, and chat orchestration.

**Key Components:**

#### Database Models (MongoDB)

- **User Model** - User accounts with company association
- **Company Model** - Multi-tenant support with settings per company
- **Chat Model** - Stores chat sessions (company_id, user_id, title, timestamps)
- **Message Model** - Stores messages with:
  - Role (user/assistant)
  - Content
  - ModelUsed (gemini-2.5-flash)
  - ResponseTime
  - Attachments (for documents)
- **ActivityLog Model** - Track all user actions
- **Role & Permission Models** - RBAC implementation

#### Current API Flow (Gemini-based)

```
Frontend → Go Backend → Gemini API
  ↓
  - User sends message via /chats/{chat_id}/messages
  - Backend retrieves chat history
  - Formats history for Gemini API
  - Calls Gemini (gemini-2.5-flash model)
  - Saves AI response to MongoDB
  - Returns response to frontend
```

#### Current Issues:

- ❌ Gemini API key hardcoded environment variable
- ❌ No knowledge base integration
- ❌ No company-specific document context
- ❌ No vector embeddings for semantic search

---

### **2. ENTERPRISE-ASSISTANT-BACKEND (Python) - RAG Service**

**Purpose:** Handle document management, chunking, embeddings, and semantic search for company-specific knowledge bases.

**Key Components:**

#### Database Models (SQL - PostgreSQL with pgvector)

- **Document**
  - `id` (UUID)
  - `company_id` (String) ⭐ Company isolation
  - `user_id` (String)
  - `filename` (String)
  - `content` (Text)
  - `created_at` (Timestamp)

- **DocumentChunk**
  - `id` (UUID)
  - `company_id` (String) ⭐ Company isolation
  - `document_id` (Foreign Key)
  - `chunk_index` (Integer)
  - `chunk_text` (Text)
  - `embedding` (JSON array of floats) ⭐ Vector embeddings
  - `created_at` (Timestamp)

#### Current API Flow (OpenRouter-based)

```
Document Upload:
1. POST /api/v1/documents
2. Split into chunks (chunking_service)
3. Generate embeddings (OpenRouter embeddings model)
4. Store chunks with embeddings in PostgreSQL
5. Generate summary using LLM

Query Processing:
1. POST /api/v1/query
2. Generate query embedding
3. Find similar chunks (cosine similarity search)
4. Filter by company_id ⭐
5. Send top_k chunks as context to LLM
6. Generate answer using RAG pattern
```

#### Services:

- **llm_service.py** - Uses OpenRouter API (replaces Gemini)
  - `generate_answer(question, context)` - Answer with document context
  - `generate_general_answer(question)` - General answer fallback

- **embeddings.py** - Generate vector embeddings
  - Uses OpenRouter embeddings model
  - Returns list[float]

- **chunking.py** - Document splitting strategy
  - Custom chunking logic

#### Current Setup:

- Uses **OpenRouter API** (which provides access to multiple LLMs)
- **EMBEDDING_MODEL** - For semantic search
- **LLM_MODEL** - For answer generation
- Stores embeddings in PostgreSQL with pgvector extension

---

### **3. FRONTEND (React) - User Interface**

**Purpose:** Provide chat interface and document management UI.

**Key Files:**

- **chatAPI.js** - Provides functions:
  - `sendMessage(chatId, content)` - Send message to Go backend
  - `createChat(title)` - Create new chat
  - `getChats()` - Get user's chats
  - `getMessages(chatId)` - Get chat history
  - `deleteChat(chatId)` - Delete chat
  - `cleanupChat(chatId)` - Auto-cleanup old chats

**Current Flow:**

- User sends message → Frontend sends to Go Backend
- Go Backend calls Gemini API
- Response returns to frontend

---

## 🔗 Current Integration Issues

### **Problem 1: No Knowledge Base Integration**

- Frontend sends messages to Go backend
- Go backend calls Gemini API directly
- **No knowledge base lookup** before generating response
- Documents uploaded are stored but never used

### **Problem 2: Gemini API Dependency**

- Hardcoded in `services/gemini_service.go`
- No flexibility to switch providers
- Not integrated with document knowledge base

### **Problem 3: No Company-Specific Knowledge Base**

- Python backend has `company_id` in Document & DocumentChunk
- But Go backend doesn't send `company_id` when querying
- Each company's documents are isolated but not used for responses

---

## ✅ Integration Plan

### **Solution: Unified RAG Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                  Chat UI + Document Upload                       │
└────────────────┬──────────────────────┬──────────────────────────┘
                 │                      │
         /chats/...messages      /documents/upload
                 │                      │
┌────────────────▼──────────────────────▼──────────────────────────┐
│          BACKEND (Go) - Main API & Orchestration                 │
│  ✅ Authentication (JWT)                                          │
│  ✅ User & Company Management                                     │
│  ✅ Message History Storage (MongoDB)                             │
│  🔄 NEW: Query Routing to RAG Service                             │
│  🔄 NEW: Context Formatting                                       │
└────────────────┬──────────────────────────────────────────────────┘
                 │
      1. Extract company_id from user
      2. Retrieve chat history
      3. Call RAG Service with company_id
      4. Get augmented response
      5. Save to MongoDB
                 │
┌────────────────▼──────────────────────────────────────────────────┐
│  ENTERPRISE-ASSISTANT-BACKEND (Python) - RAG Service              │
│  ✅ Document Management (per company)                              │
│  ✅ Vector Embeddings & Semantic Search                            │
│  ✅ Query Processing with Company Isolation                        │
│  ✅ LLM Integration (OpenRouter)                                   │
│  ✅ Context Retrieval (Cosine Similarity)                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step-by-Step Integration

### **Step 1: Modify Go Backend Chat Controller**

Replace direct Gemini call with RAG service call:

**Current Flow:**

```go
// Get chat history → Send directly to Gemini → Save response
```

**New Flow:**

```go
// Get chat history → Call RAG Service with company_id → Save response
```

### **Step 2: Create HTTP Client in Go**

- Create new file: `services/rag_service.go`
- HTTP client to call Python RAG API
- Send: `{ company_id, message, chat_history }`
- Receive: `{ answer, used_context, sources }`

### **Step 3: Add Company Context to Messages**

- Modify chat_controller.go to include company_id in RAG query
- Pass previous message context for better retrieval

### **Step 4: Enhance Document Upload**

- Integrate document upload to push documents to Python backend
- Track document processing status
- Show relevant documents in chat context

### **Step 5: Update Frontend**

- Add document upload indicator
- Show sources used in answer
- Add company knowledge base management UI

---

## 📋 Key Implementation Details

### **Database Isolation Strategy**

```
Go Backend (MongoDB):
- Every Chat, Message, User has company_id
- Queries filtered by company_id
- ✅ Already implemented

Python Backend (PostgreSQL):
- Every Document, DocumentChunk has company_id
- Queries filtered by company_id
- ✅ Already implemented
```

### **API Contract (Go ↔ Python)**

**RAG Service Endpoint:**

```
POST /api/v1/query
{
  "company_id": "507f1f77bcf86cd799439011",  // From user context
  "message": "What is the leave policy?",
  "chat_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "top_k": 5  // Number of documents to retrieve
}

Response:
{
  "answer": "...",
  "used_context": true,
  "sources": [
    {
      "document_id": "...",
      "filename": "...",
      "similarity_score": 0.92,
      "chunk_text": "..."
    }
  ],
  "model_used": "openrouter/model-name"
}
```

### **Vector Embedding Strategy**

- All document chunks automatically embedded
- Query embedding generated on request
- Cosine similarity search filters relevant chunks
- Chunks sorted by relevance + creation date
- Top-k chunks sent as context to LLM

### **Multi-Company Knowledge Base**

```
Company A:
- Document 1: HR Policies
- Document 2: IT Guidelines
- Chunks: 245 total
- Embeddings: Generated in pgvector

Company B:
- Document 1: Finance Manual
- Chunks: 156 total
- Embeddings: Generated in pgvector

Query Time:
- User from Company A asks question
- Only Company A's documents searched
- Only Company A's chunks used for context
```

---

## 🔐 Security & Performance

### **Authentication & Authorization**

- ✅ JWT tokens with company_id embedded
- ✅ Company_id extracted from token in Go backend
- ✅ Company_id verified in Python backend queries
- ✅ No cross-company data leakage possible

### **Performance Considerations**

1. **Vector Search Speed** - pgvector with proper indexing
2. **Caching** - Cache embeddings for frequently asked questions
3. **Connection Pooling** - Maintain persistent connections
4. **Timeout Handling** - Set reasonable timeouts for RAG calls

### **Cost Optimization**

- **Before:** Every message = 1 Gemini API call
- **After:** Query relevant documents first, then LLM call
- Result: Fewer LLM calls, better accuracy, lower cost

---

## 📝 Implementation Checklist

### **Phase 1: Backend Integration (Go)**

- [ ] Create `services/rag_client.go` - HTTP client to Python RAG
- [ ] Create `services/enhanced_chat_service.go` - New chat logic with RAG
- [ ] Modify `controllers/chat_controller.go` - Route to RAG instead of Gemini
- [ ] Add company_id to message save logic
- [ ] Handle RAG service failures gracefully (fallback)

### **Phase 2: Document Integration**

- [ ] Create `services/document_service.go` in Python backend
- [ ] Add document upload endpoint in Go backend
- [ ] Push documents to Python backend on upload
- [ ] Track document processing status
- [ ] Handle file type conversions (PDF, DOCX, etc.)

### **Phase 3: Frontend Integration**

- [ ] Create document upload UI
- [ ] Add sources display in chat messages
- [ ] Add knowledge base management dashboard
- [ ] Show document processing status
- [ ] Add document cleanup functionality

### **Phase 4: Testing & Optimization**

- [ ] Test RAG with various document types
- [ ] Verify company isolation
- [ ] Load testing with multiple concurrent queries
- [ ] Embedding quality evaluation
- [ ] Cost analysis

---

## 🚀 Expected Benefits

1. **Better Answers** - Responses informed by company documents
2. **Cost Reduction** - Fewer API calls, targeted LLM usage
3. **Company-Specific** - Each company has isolated knowledge base
4. **Flexibility** - Can switch LLM providers via OpenRouter
5. **Scalability** - Vector search scales to large document sets
6. **Audit Trail** - Track which documents were used for answers

---

## 📊 Technology Stack Summary

| Component        | Technology                               | Purpose                         |
| ---------------- | ---------------------------------------- | ------------------------------- |
| **Main API**     | Go + Echo + MongoDB                      | Authentication, chat management |
| **RAG Service**  | Python + FastAPI + PostgreSQL + pgvector | Doc management, semantic search |
| **LLM Provider** | OpenRouter API                           | Multi-model LLM access          |
| **Embeddings**   | OpenRouter Embeddings                    | Vector representations          |
| **Frontend**     | React + Redux                            | User interface                  |
| **Auth**         | JWT + bcrypt                             | Security                        |

---

## ⚠️ Current Dependencies & Env Variables

### **Go Backend (.env)**

```
MONGODB_URI=mongodb://...
GEMINI_API_KEY=xxxxx  ← NEEDS TO BE REMOVED
FRONTEND_URL=http://localhost:3000
JWT_SECRET=xxxxx
```

### **Python Backend (.env)**

```
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
EMBEDDING_MODEL=openrouter/embedding-model
LLM_MODEL=openrouter/model-name
```

---

## 📞 Questions to Clarify

1. **LLM Choice**: Which model via OpenRouter? (Claude, Llama, GPT, etc.)
2. **Embedding Model**: Which embedding model for vectors?
3. **Document Types**: What file types to support? (PDF, DOCX, TXT, etc.)
4. **Company Scale**: Expected number of documents per company?
5. **Response Time**: Expected query response time SLA?

---

## 🎯 Next Steps

1. **Review this architecture** with your team
2. **Set up Python environment** - Install dependencies
3. **Configure API keys** - Get OpenRouter account
4. **Start with Step 1** - Modify Go backend to call RAG
5. **Test in isolation** - Verify RAG service works
6. **Integrate with frontend** - Add document upload
7. **Deploy & monitor** - Track performance

---

**Document prepared for:** Complete Project Understanding & Integration Planning
**Status:** Ready for implementation
**Last Updated:** March 22, 2026
