# 📚 EXECUTIVE SUMMARY - Project Understanding & Integration Plan

## 🎯 High-Level Overview

You have a **3-part multi-tenant enterprise assistant** application:

1. **React Frontend** - Chat UI + Document Management
2. **Go Backend** - Main API, Authentication, User/Company Management
3. **Python RAG Service** - Document indexing, semantic search, LLM responses

### Current State:

- ❌ Backend uses **Gemini API** directly (no knowledge base)
- ✅ RAG Service has **knowledge base per company** ready to use
- ❌ Frontend shows chat but **not connected to documents**
- ✅ Multi-tenant architecture with **company_id isolation** already in place

### What We're Building:

A **unified RAG (Retrieval-Augmented Generation)** system where:

1. User asks question in chat
2. Backend checks company's document knowledge base
3. Relevant documents are retrieved
4. LLM generates answer using document context
5. Frontend shows answer + source documents

---

## 📊 Three Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React) - Port 3000                                    │
│ User sends message → Displays answer + sources                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
            HTTP / REST API
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ GO BACKEND (Main API) - Port 8080                               │
│                                                                  │
│ ✅ Authentication (JWT)                                         │
│ ✅ User & Company Management                                    │
│ ✅ Chat History (MongoDB)                                       │
│ 🔄 NEW: Call Python RAG Service                                 │
│ 🔄 NEW: Return Sources + Answer                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
            HTTP / REST API
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ PYTHON RAG SERVICE - Port 8000                                  │
│                                                                  │
│ ✅ Document Management (per company)                             │
│ ✅ Vector Embeddings (pgvector)                                 │
│ ✅ Semantic Search (cosine similarity)                          │
│ ✅ LLM Integration (OpenRouter)                                 │
│ ✅ Company Isolation (SQL queries)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure Quick Reference

### **Backend (Go)**

```
backend/
├── go.mod                    # Dependencies
├── main.go                   # ← ADD InitRAGClient()
├── config/
│   ├── config.go            # App config
│   └── database.go          # MongoDB connection
├── models/
│   ├── chat.go             # Chat with company_id ✅
│   ├── message.go          # Message storage ✅
│   └── company.go          # Company model ✅
├── services/
│   ├── gemini_service.go   # Current (keep as fallback)
│   ├── chat_service.go     # Chat operations ✅
│   └── rag_client.go       # ← CREATE NEW FILE
├── controllers/
│   ├── chat_controller.go  # ← MODIFY: Replace Gemini call
│   └── document_controller.go
├── routes/
│   └── routes.go           # API endpoints ✅
└── .env                    # ← ADD RAG_SERVICE_URL
```

### **Python RAG Service**

```
Enterprise-Assistant-Backend/
├── main.py                 # FastAPI app (READY)
├── config.py               # Config (READY)
├── database.py             # PostgreSQL connection (READY)
├── models/
│   ├── document.py         # Document model with company_id ✅
│   └── document_chunk.py   # Chunks with embeddings ✅
├── services/
│   ├── llm_service.py      # LLM calls (OpenRouter) ✅
│   ├── embeddings.py       # Vector embeddings ✅
│   └── chunking.py         # Text chunking ✅
├── routes/
│   ├── document_routes.py  # Upload/manage docs (READY)
│   └── query_routes.py     # Answer queries (READY)
└── requirements.txt        # Dependencies ✅
```

### **Frontend (React)**

```
frontend/
├── src/
│   ├── App.jsx
│   ├── services/
│   │   └── chatAPI.js      # ← ADD uploadDocument()
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatContainer.jsx   # Chat display
│   │   │   ├── Message.jsx         # ← SHOW sources
│   │   │   └── DocumentUpload.jsx  # Upload UI
│   │   └── ...
│   └── ...
└── .env
```

---

## 🔄 Data Flow (Current vs. New)

### **CURRENT STATE (Without Integration)**

```
Frontend User Message
    ↓
Go Backend
    ↓
Gemini API ← No context about company documents
    ↓
Generic Answer (no sources)
    ↓
Frontend
```

### **NEW STATE (After Integration)**

```
Frontend User Message
    ↓
Go Backend (receives company_id from JWT)
    ↓
Python RAG Service
    ├─ Search company's documents
    ├─ Find similar chunks
    ├─ Generate answer with context
    └─ Return [answer, sources, confidence]
    ↓
Frontend (shows answer + which documents were used)
```

---

## 🗃️ Database Comparison

### **MongoDB (Go Backend)**

```javascript
// Messages include company_id
{
  _id: ObjectId,
  chat_id: ObjectId,
  company_id: ObjectId,  // ← Isolation
  role: "user" | "assistant",
  content: "...",
  model_used: "gemini-2.5-flash",
  created_at: Date
}
```

### **PostgreSQL (Python RAG)**

```sql
-- Documents belong to companies
CREATE TABLE documents (
  id UUID,
  company_id VARCHAR(255),  -- ← Isolation Key
  filename VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP
);

-- Chunks are indexed by company
CREATE TABLE document_chunks (
  id UUID,
  company_id VARCHAR(255),  -- ← CRITICAL: Same as parent doc
  document_id UUID,
  chunk_index INT,
  chunk_text TEXT,
  embedding VECTOR(1536),   -- For semantic search
  created_at TIMESTAMP
);
```

---

## 🔐 Company Isolation Strategy

**How Multi-Tenant Works:**

1. **User Logs In**
   - JWT token created with: user_id, company_id
2. **User Sends Message**
   - Go backend extracts company_id from token
   - Sends to RAG Service with company_id
3. **RAG Service Processes**
   - Query: `SELECT * FROM chunks WHERE company_id = 'company-xyz'`
   - Only retrieves that company's documents
   - NO cross-company data leakage possible

4. **Answer Generated**
   - Uses only that company's knowledge base
   - Sources reference only that company's documents

**Safety Mechanism:**

```go
// In Go backend
companyID := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
// This is extracted from JWT - cannot be spoofed

// Passed to RAG service
services.QueryRAGService(companyID.Hex(), ...)

// RAG service MUST filter by company_id
// SELECT * FROM chunks WHERE company_id = requestedCompanyID
```

---

## 📝 Integration Checklist (Priority Order)

### **Phase 1: Core Integration (REQUIRED)**

- [ ] **Create `backend/services/rag_client.go`** - HTTP client to RAG service
- [ ] **Modify `backend/controllers/chat_controller.go`** - Call RAG instead of Gemini
- [ ] **Update `backend/main.go`** - Initialize RAG client
- [ ] **Add to `backend/.env`** - RAG_SERVICE_URL
- [ ] **Test:** Send message → Get answer with sources

### **Phase 2: Document Management (RECOMMENDED)**

- [ ] Create `backend/services/document_service.go`
- [ ] Modify document upload to send to RAG service
- [ ] Track document processing status

### **Phase 3: Frontend Display (NICE TO HAVE)**

- [ ] Update `frontend/src/components/Chat/Message.jsx` - Show sources
- [ ] Add `frontend/src/services/chatAPI.js` - uploadDocument()
- [ ] Create document management UI

### **Phase 4: Polish & Optimization (LATER)**

- [ ] Add caching for frequent queries
- [ ] Optimize embeddings generation
- [ ] Performance monitoring
- [ ] Cost tracking

---

## 🚀 Quick Start (45 minutes)

### **Step 1: Verify Python RAG Service (5 min)**

```bash
cd Enterprise-Assistant-Backend
pip install -r requirements.txt
# Create .env with DATABASE_URL, OPENROUTER_API_KEY
python main.py

# In another terminal, test:
curl http://localhost:8000/
# Should return: {"status": "ok"}
```

### **Step 2: Create RAG Client (10 min)**

- Copy code from `CODE_IMPLEMENTATION.md` → Part 1
- Save as `backend/services/rag_client.go`
- Should compile without errors

### **Step 3: Modify Chat Controller (15 min)**

- Edit `backend/controllers/chat_controller.go`
- Find CreateMessage function
- Replace Gemini call with RAG call (see CODE_IMPLEMENTATION.md)

### **Step 4: Initialize RAG Client (2 min)**

- Edit `backend/main.go`
- Add `services.InitRAGClient()` after `services.Init()`

### **Step 5: Update .env (1 min)**

```env
RAG_SERVICE_URL=http://localhost:8000
# Keep other variables same
```

### **Step 6: Test (12 min)**

```bash
# Terminal 1
cd Enterprise-Assistant-Backend
python main.py

# Terminal 2 - Upload test document
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company",
    "user_id": "test-user",
    "filename": "test.txt",
    "text": "Our policy: 20 days leave, remote work allowed"
  }'

# Terminal 3
cd backend
go run main.go

# Test chat (requires valid auth token)
curl -X POST http://localhost:8080/api/chats/CHAT_ID/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is our leave policy?"}'

# Should see sources in response!
```

---

## 🔗 Key Files to Modify

### **MUST MODIFY (Phase 1)**

| File                                     | Change     | Reason              |
| ---------------------------------------- | ---------- | ------------------- |
| `backend/services/rag_client.go`         | CREATE NEW | HTTP client to RAG  |
| `backend/controllers/chat_controller.go` | MODIFY     | Replace Gemini call |
| `backend/main.go`                        | MODIFY     | Initialize RAG      |
| `backend/.env`                           | ADD        | RAG_SERVICE_URL     |

### **SHOULD MODIFY (Phase 2)**

| File                                         | Change     | Reason             |
| -------------------------------------------- | ---------- | ------------------ |
| `backend/services/document_service.go`       | CREATE NEW | Upload to RAG      |
| `backend/controllers/document_controller.go` | MODIFY     | Forward to RAG     |
| `frontend/src/components/Chat/Message.jsx`   | MODIFY     | Show sources       |
| `frontend/src/services/chatAPI.js`           | MODIFY     | Add uploadDocument |

### **ALREADY CORRECT**

| File                             | Status   | Reason                   |
| -------------------------------- | -------- | ------------------------ |
| `Enterprise-Assistant-Backend/*` | ✅ READY | Already has RAG logic    |
| `backend/models/chat.go`         | ✅ READY | Has company_id           |
| `backend/models/message.go`      | ✅ READY | Has company isolation    |
| `backend/routes/routes.go`       | ✅ READY | Auth middleware in place |

---

## 🎓 Learning Resources

### **Understanding RAG (Retrieval-Augmented Generation)**

- User asks question
- System retrieves relevant documents
- LLM uses documents as context
- Answer is grounded in actual data (not hallucination)

### **Vector Databases & Embeddings**

- Embeddings: Convert text → numbers (1536 dimensions)
- Cosine Similarity: Measure text relevance (0-1 score)
- pgvector: PostgreSQL extension for vector search

### **Multi-Tenancy**

- Each company gets isolated knowledge base
- company_id filters all queries
- No cross-company data leakage

---

## ⚡ Expected Benefits After Integration

### **Better Quality Answers**

- Answers based on company's actual policies
- Not generic responses (sourced from training data)

### **Cost Reduction**

- ✅ Before: ~1000 messages = 1000 Gemini API calls = $$
- ✅ After: 1000 messages = 1000 OpenRouter calls (cheaper) + vector search (free)

### **Traceability**

- Can show which documents were used
- Improves user trust
- Useful for audits

### **Scalability**

- Works with 100 documents or 10,000
- Vector search is fast even with large datasets

### **Company Self-Service**

- Each company uploads their own documents
- No shared knowledge base
- Complete separation

---

## 🆘 Common Questions & Answers

### **Q: Will it replace Gemini completely?**

**A:** Yes, for company-specific questions. Gemini is kept as fallback if RAG service is down.

### **Q: How long does a query take?**

**A:** Typically 2-3 seconds (embedding generation ~1s, LLM call ~1-2s).

### **Q: Can companies see each other's documents?**

**A:** NO. Every query filters by company_id. SQL queries prevent cross-company access.

### **Q: What if a company has no documents?**

**A:** RAG will return general answer (no context). Response shows "used_context: false".

### **Q: How many documents per company?**

**A:** Unlimited. Vector search handles millions of chunks. Cost depends on your OpenRouter usage.

### **Q: Can we switch LLM providers later?**

**A:** YES. OpenRouter supports Claude, GPT-4, Llama, Mixtral, etc. Change one config variable.

### **Q: What if Gemini API key is invalid?**

**A:** Fine. After integration, you don't need it. Remove it and use OpenRouter only.

---

## 📞 Configuration Checklist

### **Go Backend (.env)**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/chatgpt_clone

# Existing
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key

# NEW - RAG Integration
RAG_SERVICE_URL=http://localhost:8000

# OPTIONAL - Fallback (can remove later)
GEMINI_API_KEY=xxx
```

### **Python Backend (.env)**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rag_db

# LLM Provider
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Models
EMBEDDING_MODEL=openrouter/embedding-model
LLM_MODEL=openrouter/claude-3.5-sonnet

# Optional
LOG_LEVEL=INFO
```

### **Frontend (.env)**

```env
REACT_APP_API_URL=http://localhost:8080
```

---

## 📊 Expected Response Format

### **Current (Gemini)**

```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "id": "...",
    "content": "Generic answer",
    "model_used": "gemini-2.5-flash"
  }
}
```

### **After Integration (with RAG)**

```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "message": {
      "id": "...",
      "content": "Answer based on company policy",
      "model_used": "openrouter/claude-3.5-sonnet"
    },
    "sources": [
      {
        "document_id": "uuid-123",
        "filename": "employee_handbook.pdf",
        "similarity_score": 0.92,
        "chunk_text": "Annual leave entitlement..."
      }
    ],
    "used_context": true
  }
}
```

---

## 🎯 Next Steps

1. **Review this summary** ← You are here
2. **Read `PROJECT_ANALYSIS.md`** for detailed understanding
3. **Follow `INTEGRATION_GUIDE.md`** for step-by-step instructions
4. **Use `CODE_IMPLEMENTATION.md`** for actual code (copy-paste ready)
5. **Test using the testing commands** provided in CODE_IMPLEMENTATION.md
6. **Deploy** and monitor performance

---

## 📞 Support & Troubleshooting

### **RAG Service won't start?**

```bash
# Check PostgreSQL is running
psql postgresql://user:pass@localhost:5432/rag_db -c "SELECT 1"

# Check dependencies
pip install -r requirements.txt

# Check env vars
echo $DATABASE_URL
echo $OPENROUTER_API_KEY
```

### **Go backend can't reach RAG?**

```bash
# Test connectivity
curl http://localhost:8000/

# Check env var
echo $RAG_SERVICE_URL
```

### **Queries returning wrong company's data?**

```sql
-- Verify company_id in chunks
SELECT DISTINCT company_id FROM document_chunks;

-- Check filtering in query
SELECT * FROM document_chunks WHERE company_id = 'YOUR_ID';
```

---

## 📈 Success Metrics

Track these after implementation:

1. **Query Accuracy** - Are answers relevant to questions?
2. **Response Time** - Should be < 5 seconds
3. **Context Usage** - How often are documents used? (% queries)
4. **Cost per Query** - OpenRouter cost vs Gemini
5. **User Satisfaction** - Do users find sources helpful?

---

**Document Status:** ✅ Complete  
**Difficulty Level:** Medium (for Go developers)  
**Time to Complete:** 1-2 hours  
**Tools Needed:** Go, Python, PostgreSQL, OpenRouter API key  
**Version:** 1.0 (March 2026)

---

**READY TO IMPLEMENT?** Start with `CODE_IMPLEMENTATION.md` Part 1 → Create rag_client.go
