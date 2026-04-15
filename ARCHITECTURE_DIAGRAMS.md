# 🎨 ARCHITECTURE DIAGRAMS & QUICK REFERENCE

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND LAYER                               │
│                                (React - Port 3000)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │   Chat Interface     │  │  Document Manager    │  │  User Profile    │ │
│  │                      │  │                      │  │                  │ │
│  │ • Send messages      │  │ • Upload documents   │  │ • Settings       │ │
│  │ • View history       │  │ • See upload status  │  │ • Company info   │ │
│  │ • Display sources ✨ │  │ • Manage docs        │  │ • Logout         │ │
│  └──────────────┬───────┘  └──────────────┬───────┘  └────────┬─────────┘ │
└─────────────────┼──────────────────────────┼─────────────────┼──────────────┘
                  │                          │                 │
         HTTP / REST API                 HTTP POST             │
    (JSON + JWT Bearer Token)         (FormData)              │
                  │                          │                 │
┌─────────────────▼──────────────────────────▼─────────────────▼──────────────┐
│                        API GATEWAY / MIDDLEWARE LAYER                        │
│                      (Go Echo Framework - Port 8080)                         │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ AUTHENTICATION LAYER                                                │  │
│  │ • JWT Validation → Extract user_id, company_id                    │  │
│  │ • Permission Checks                                                 │  │
│  │ • Activity Logging                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ REQUEST ROUTING                                                      │  │
│  │                                                                      │  │
│  │ POST /chats/{id}/messages → CreateMessage Controller               │  │
│  │ ├─ Extract company_id from JWT                                     │  │
│  │ ├─ Save user message to MongoDB                                    │  │
│  │ ├─ πCall RAG Service (NEW!)                                         │  │
│  │ │  └─ Pass: company_id, message, chat_history                     │  │
│  │ ├─ Save AI response with sources (NEW!)                            │  │
│  │ └─ Return: answer + sources + used_context                         │  │
│  │                                                                      │  │
│  │ POST /chats/{id}/documents → DocumentUpload Controller             │  │
│  │ ├─ Validate file                                                    │  │
│  │ ├─ Extract text from document                                       │  │
│  │ └─ Forward to RAG Service for indexing (NEW!)                       │  │
│  │                                                                      │  │
│  │ GET /chats, GET /chat/{id}, PUT /chats/{id}, etc.                 │  │
│  │ └─ Existing functionality (unchanged)                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ LOCAL STORAGE LAYER (MongoDB)                                       │  │
│  │                                                                      │  │
│  │ databases:                                                           │  │
│  │   users             (with company_id ✓)                            │  │
│  │   companies         (multi-tenant settings)                         │  │
│  │   chats             (with company_id ✓)                            │  │
│  │   messages          (with company_id ✓)                            │  │
│  │   activity_logs                                                     │  │
│  │   roles & permissions                                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────┬──────────────────────┬──────────────────────────────────┘
                  │                      │
         HTTP/1.1 POST                  │
    /api/v1/query                       │
    /api/v1/documents               HTTP/1.1 POST
                  │                   (raw file bytes)
┌─────────────────▼──────────────────────▼──────────────────────────────────┐
│              KNOWLEDGE BASE & RAG SERVICE LAYER                             │
│              (Python FastAPI - Port 8000)                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ DOCUMENT INGESTION (document_routes.py)                             │  │
│  │                                                                      │  │
│  │ POST /api/v1/documents                                              │  │
│  │ ├─ Validate input (company_id, user_id, text)                      │  │
│  │ ├─ Split text into chunks (chunking_service.py)                     │  │
│  │ │  └─ Overlap-aware chunking (e.g., 512 tokens with overlap)       │  │
│  │ ├─ Generate embeddings for chunks (embeddings_service.py)           │  │
│  │ │  └─ Call OpenRouter Embeddings API → 1536-dim vector             │  │
│  │ ├─ Store in PostgreSQL:                                             │  │
│  │ │  ├─ documents table (company_id, filename, content)              │  │
│  │ │  ├─ document_chunks table (company_id, text, embedding)          │  │
│  │ │  └─ Create pgvector index on embeddings                          │  │
│  │ └─ Return: document_id, chunks_created, summary                    │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ QUERY PROCESSING (query_routes.py) - THE MAGIC HAPPENS HERE!       │  │
│  │                                                                      │  │
│  │ POST /api/v1/query                                                  │  │
│  │ {                                                                    │  │
│  │   \"company_id\": \"507f1f77bcf86cd799439011\",                    │  │
│  │   \"message\": \"What is our leave policy?\",                      │  │
│  │   \"chat_history\": [ ... ],                                        │  │
│  │   \"top_k\": 5                                                       │  │
│  │ }                                                                    │  │
│  │                                                                      │  │
│  │ Processing Steps:                                                    │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 1: Generate Query Embedding                             │   │  │
│  │ │ • Call OpenRouter Embeddings API                             │   │  │
│  │ │ • Convert \"What is our leave policy?\" → [1536 floats]     │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                          ↓                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 2: Find Similar Chunks (COMPANY ISOLATION!)            │   │  │
│  │ │ • Query: SELECT * FROM document_chunks                       │   │  │
│  │ │          WHERE company_id = '507f...' ← CRITICAL            │   │  │
│  │ │ • Cosine similarity search: embedding <-> query_embedding   │   │  │
│  │ │ • Rank by similarity score                                   │   │  │
│  │ │ • Take top_k results (e.g., top 5)                          │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                          ↓                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 3: Filter by Confidence Threshold                       │   │  │
│  │ │ • Keep chunks with similarity > THRESHOLD                    │   │  │
│  │ │ • If no relevant chunks → fallback to general answer         │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                          ↓                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 4: Build Context Prompt                                 │   │  │
│  │ │ • Concatenate top chunks: \"chunk1\\n\\nchunk2\\n\\nchunk3\" │   │  │
│  │ │ • Max length: 4000 tokens (to fit in LLM context)           │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                          ↓                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 5: Call LLM with RAG Prompt                             │   │  │
│  │ │ system: \"Answer using ONLY provided context\"                │   │  │
│  │ │ user: \"Question: ...\\n\\nContext: [chunks]\"               │   │  │
│  │ │ • Call OpenRouter API (Claude / GPT / Llama)                 │   │  │
│  │ │ • Get structured answer                                      │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                          ↓                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ Step 6: Format Response                                      │   │  │
│  │ │ {                                                             │   │  │
│  │ │   \"answer\": \"Based on our policy, leave is...\",         │   │  │
│  │ │   \"used_context\": true,                                    │   │  │
│  │ │   \"sources\": [                                              │   │  │
│  │ │     {                                                         │   │  │
│  │ │       \"document_id\": \"uuid-123\",                          │   │  │
│  │ │       \"filename\": \"employee_handbook.pdf\",                │   │  │
│  │ │       \"similarity_score\": 0.92,                             │   │  │
│  │ │       \"chunk_text\": \"Annual leave...\"                    │   │  │
│  │ │     }                                                         │   │  │
│  │ │   ],                                                          │   │  │
│  │ │   \"model_used\": \"openrouter/claude-3.5-sonnet\"           │   │  │
│  │ │ }                                                             │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ KNOWLEDGE BASE STORAGE (PostgreSQL)                                 │  │
│  │                                                                      │  │
│  │ Table: documents                                                    │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ id (UUID)          | 550e8400-e291-11d3-a756-446655440000  │   │  │
│  │ │ company_id (TEXT)  | \"507f1f77bcf86cd799439011\" ← KEY   │   │  │
│  │ │ filename (TEXT)    | \"employee_handbook.pdf\"               │   │  │
│  │ │ content (TEXT)     | \"Our company policies...\"             │   │  │
│  │ │ created_at         | 2024-03-22 10:30:00                    │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │ Table: document_chunks (with pgvector extension!)                   │  │
│  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│  │ │ id (UUID)              | 123e4567-e89b-1234-5678-910111111   │   │  │
│  │ │ company_id (TEXT)      | \"507f1f77bcf86cd799439011\" ✅    │   │  │
│  │ │ document_id (UUID)     | 550e8400-e291-11d3-a756-446655... │   │  │
│  │ │ chunk_index (INT)      | 0                                   │   │  │
│  │ │ chunk_text (TEXT)      | \"Leave policy: 20 days annual...\" │   │  │
│  │ │ embedding (VECTOR)     | [0.123, -0.456, 0.789, ...] (1536) │   │  │
│  │ │ created_at             | 2024-03-22 10:30:30                 │   │  │
│  │ └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │ Indexes: ✨                                                          │  │
│  │ • idx_company_id: Fast lookup for company's docs                   │  │
│  │ • idx_embedding: IVFFLAT index for cosine similarity search        │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────┬──────────────────────────────────────────────────────────┘
                  │
        HTTP/1.1 POST
  /v1/embeddings
  /v1/chat/completions
                  │
┌─────────────────▼──────────────────────────────────────────────────────────┐
│                      EXTERNAL LLM PROVIDER LAYER                            │
│                   (OpenRouter.ai - Multi-LLM Gateway)                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Available Models:                                                          │
│  ├─ Claude 3.5 Sonnet (Recommended) ⭐                                    │
│  ├─ GPT-4 Turbo                                                            │
│  ├─ GPT-4o                                                                 │
│  ├─ Llama 2 / 3                                                            │
│  ├─ Mixtral 8x7B                                                           │
│  └─ Many more...                                                           │
│                                                                             │
│  Services:                                                                  │
│  ├─ /v1/embeddings - Generate vector embeddings                           │
│  ├─ /v1/chat/completions - LLM inference                                  │
│  └─ /v1/moderations - Content moderation                                  │
│                                                                             │
│  Why OpenRouter?                                                            │
│  ✓ One API key works with multiple LLMs                                    │
│  ✓ Free credits for development                                            │
│  ✓ Billing aggregation                                                     │
│  ✓ Easy to switch models (1 config change)                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### **User Sends Message**

```
┌──────────────┐
│ User Types   │
│ \"Leave      │
│ Policy?\"   │
└──────┬───────┘
       │
       │ HTTP POST
       │ /chats/{id}/messages
       │ {\"content\": \"Leave Policy?\"}
       │ Headers: {Authorization: Bearer JWT_TOKEN}
       │
       ▼
┌──────────────────────────────────────┐
│ Go Backend - JWT Middleware          │
├──────────────────────────────────────┤
│ Extracts from JWT:                   │
│ • user_id:   \"user-123\"            │
│ • company_id: \"company-456\"        │
│ ✓ Token valid                        │
│ ✓ Permissions granted                │
└──────────┬───────────────────────────┘
           │
           │ Calls: services.QueryRAGService(
           │   companyID = \"company-456\",
           │   message = \"Leave Policy?\",
           │   history = [ ... ],
           │   topK = 5
           │ )
           │
           ▼
┌──────────────────────────────────────┐
│ RAG Client (rag_client.go)           │
├──────────────────────────────────────┤
│ HTTP POST to Python RAG service       │
│ {                                     │
│   \"company_id\": \"company-456\",   │
│   \"message\": \"Leave Policy?\",   │
│   \"chat_history\": [ ... ]        │
│ }                                     │
└──────────┬───────────────────────────┘
           │
           │ HTTP POST to http://localhost:8000/api/v1/query
           │
           ▼
┌──────────────────────────────────────┐
│ Python RAG Service                   │
├──────────────────────────────────────┤
│                                       │
│ 1️⃣ Generate Embedding                │
│    \"Leave Policy?\" → [1536 floats] │
│                                       │
│ 2️⃣ Query Relevant Chunks             │
│    SELECT * FROM document_chunks     │
│    WHERE company_id = \"company-456\" │
│    ORDER BY cosine_similarity DESC   │
│    LIMIT 5                            │
│                                       │
│    Results (ranked by relevance):     │
│    • Chunk 1: \"20 days annual...\" (score: 0.92) ✓
│    • Chunk 2: \"Can carry over...\"  (score: 0.88) ✓
│    • Chunk 3: \"Request via HR...\"  (score: 0.76) ✓
│    • Chunk 4: \"Sick leave...\"      (score: 0.45) ✗
│    • Chunk 5: \"Public holidays...\"  (score: 0.31) ✗
│                                       │
│ 3️⃣ Build Context                     │
│    Context = Chunk1 + Chunk2 + Chunk3
│                                       │
│ 4️⃣ Call OpenRouter API               │
│    system: \"Answer using context\"   │
│    user: \"Q: Leave Policy?\"         │
│           \"Context: [3 chunks]\"    │
│                                       │
│ 5️⃣ LLM Generates Answer              │
│    \"Our company offers 20 days...\" │
│                                       │
│ 6️⃣ Format Response                   │
│    {                                  │
│      \"answer\": \"Our company...\",  │
│      \"used_context\": true,          │
│      \"sources\": [                    │
│        {                               │
│          \"document_id\": \"uuid\",    │
│          \"filename\": \"handbook\",   │
│          \"similarity_score\": 0.92,   │
│          \"chunk_text\": \"20 days\"   │
│        },                              │
│        ...                             │
│      ]                                 │
│    }                                  │
└──────────┬───────────────────────────┘
           │
           │ HTTP Response
           │
           ▼
┌──────────────────────────────────────┐
│ Back to Go Backend                   │
├──────────────────────────────────────┤
│ Receives RAG response ✓               │
│ Save to MongoDB:                      │
│ • Message content                     │
│ • Model used: \"claude-3.5-sonnet\"  │
│ • Sources metadata                    │
└──────────┬───────────────────────────┘
           │
           │ HTTP Response to Frontend
           │
           ▼
┌──────────────────────────────────────┐
│ React Frontend                       │
├──────────────────────────────────────┤
│ Displays to User:                    │
│ ┌────────────────────────────────┐   │
│ │ AI Assistant                   │   │
│ │                                │   │
│ │ Our company offers 20 days of  │   │
│ │ annual leave, which can be...  │   │
│ │                                │   │
│ │ [▼] Sources Used (2)          │   │
│ │ • employee_handbook.pdf (92%)  │   │
│ │ • leave_policy_2024.txt (88%)  │   │
│ └────────────────────────────────┘   │
│                                       │
│ User feels confident because they    │
│ see the answer is from company docs! │
└──────────────────────────────────────┘
```

---

## Company Isolation Mechanism

```
COMPANY A                           COMPANY B
┌──────────────┐                   ┌──────────────┐
│   User: Amy  │                   │  User: Bob   │
│ Company: A   │                   │ Company: B   │
└──────┬───────┘                   └──────┬───────┘
       │                                   │
       │ Token: {                         │ Token: {
       │   user_id: \"amy-123\",         │   user_id: \"bob-456\",
       │   company_id: \"comp-aaa\" ✓  │   company_id: \"comp-bbb\" ✓
       │ }                               │ }
       │                                   │
       │ Query: \"Leave policy?\"        │ Query: \"Leave policy?\"
       │                                   │
       ├──────────────┬────────────────────┤
       │              │                    │
       │              ▼                    ▼
       │      ┌─────────────────────────────────┐
       │      │ Go Backend                      │
       │      │ Extract company_id from JWT:    │
       │      │ • From Amy's token: \"comp-aaa\"│
       │      │ • From Bob's token: \"comp-bbb\"│
       │      └─────────────────────────────────┘
       │              │
       │              │ Call RAG with company_id
       │              │
       │              ▼
       │      ┌─────────────────────────────────────────┐
       │      │ Python RAG Service                      │
       │      │                                         │
       │      │ For Amy's query:                        │
       │      │ SELECT * FROM chunks                    │
       │      │ WHERE company_id = \"comp-aaa\" ✅      │
       │      │                                         │
       │      │ For Bob's query:                        │
       │      │ SELECT * FROM chunks                    │
       │      │ WHERE company_id = \"comp-bbb\" ✅      │
       │      │                                         │
       │      │ ⚠️ Never mixes!"                        │
       │      └─────────────────────────────────────────┘
       │              │
       │              │ Returns only relevant chunks
       │              │
       │ ┌────────────┴──────────────┐
       │ │                           │
       ▼ ▼                           ▼ ▼
┌────────────────┐           ┌──────────────────┐
│ Amy sees:      │           │ Bob sees:        │
│ • Our docs     │           │ • Their docs     │
│ • comp-aaa     │           │ • comp-bbb       │
│   knowledge    │           │   knowledge      │
│   base         │           │   base           │
└────────────────┘           └──────────────────┘
```

---

## Message Flow Sequence Diagram

```
Timeline:
0ms      ┬
         │
    ┌────▼─────────────────────────────────┐
    │ 1. Frontend sends message             │
    │    POST /chats/{id}/messages          │
    │    Content: \"Leave policy?\"         │
    │    Auth Bearer: JWT_TOKEN            │
5ms │    (includes company_id in token)    │
    └────────────────────────────────────┬─┘
         │
    ┌────▼─────────────────────────────────┐
    │ 2. Go Backend processes              │
    │    • Validates JWT                   │
10ms│    • Extracts company_id: \"comp-aa\"│
    │    • Saves user message              │
    │    • Calls RAG Service               │
    └────────────────────────────────────┬─┘
         │
    ┌────▼─────────────────────────────────┐
    │ 3. RAG Client sends HTTP request      │
    │    POST /api/v1/query                │
    │    • company_id: \"comp-aa\"          │
    │    • message: \"Leave policy?\"       │
15ms│    • top_k: 5                        │
    │    Network latency: ~5ms            │
    └────────────────────────────────────┬─┘
         │
    ┌────▼─────────────────────────────────────────────┐
    │ 4. Python RAG Service processes                   │
    │    Step 1: Generate query embedding              │
    │    • Call OpenRouter /v1/embeddings              │
20ms│    • \"Leave policy?\" → [1536 floats]           │
    │    • Network latency: ~50ms                      │
    │    • Processing: ~100ms                          │
    └────────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
    │ 5. Vector similarity search                   │
    │    SELECT * FROM document_chunks              │
    │    WHERE company_id = \"comp-aa\"              │
150ms   COSINE_SIMILARITY(embedding) > THRESHOLD   │
    │    Rank by score                              │
    │    Take top 5                                 │
    │    Processing: ~50ms                          │
    └────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
    │ Step 2: Filter & rank chunks                  │
    │    Keep score >= 0.2                          │
    │    Get top 3 relevant chunks                  │
200ms   Processing: ~10ms                          │
    │    • Chunk 1: \"20 days leave\" (0.92)       │
    │    • Chunk 2: \"Can carry over\" (0.88)      │
    │    • Chunk 3: \"Via HR request\" (0.76)      │
    └────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
    │ Step 3: Call LLM                               │
    │    POST to OpenRouter /v1/chat/completions    │
    │    system: \"Answer using context\"            │
210ms   user: \"Q: Leave policy?\\nContext: [3 chunks]\"
    │    Model: claude-3.5-sonnet                   │
    │    Network latency: ~50ms                     │
    │    LLM inference: ~800ms                      │
    └────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
1050ms   │ Step 4: Format response                   │
    │    answer: \"Our company offers 20 days...\" │
    │    used_context: true                        │
    │    sources: [...]                            │
    │    model_used: \"claude-3.5-sonnet\"         │
    │    confidence: 0.92                          │
    └────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
    │ 6. Return to Go Backend                        │
    │    HTTP 200 OK with JSON response             │
1060ms  Network latency: ~10ms                      │
    │    Go Backend saves to MongoDB                │
    │    Timestamp when response received           │
    └────────────────────────────────────────────┬─┘
         │
    ┌────▼──────────────────────────────────────────┐
    │ 7. Frontend receives response                 │
    │    Display answer                             │
1070ms  Show sources dropdown                       │
    │    Update chat UI                            │
    │    Total time: ~1070ms = 1.07 seconds        │
    └──────────────────────────────────────────────┘

Goal: Keep total time < 5 seconds ✅
```

---

## Database Schema Visualization

```
MONGODB (Go Backend)
════════════════════════════════════════════════════════════════════

Collection: users
┌────────────────────────────────────────────────────────────┐
│ _id: ObjectId(\"...\")                                    │
│ name: \"Amy Johnson\"                                      │
│ email: \"amy@company-a.com\"                              │
│ company_id: ObjectId(\"comp-aaa\") ← ISOLATION KEY!      │
│ role_id: ObjectId(\"...\"                                │
│ is_active: true                                           │
│ created_at: ISODate(\"2024-03-22...\")                   │
└────────────────────────────────────────────────────────────┘
    ↑
    │ References
    │
┌────────────────────────────────────────────────────────────┐
│ Collection: chats                                          │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ _id: ObjectId(\"chat-123\")                          │  │
│ │ user_id: ObjectId(\"user-amy\")                      │  │
│ │ company_id: ObjectId(\"comp-aaa\") ← ISOLATION      │  │
│ │ title: \"Leave Policy Discussion\"                  │  │
│ │ is_archived: false                                  │  │
│ │ created_at: ISODate(...)                            │  │
│ │ updated_at: ISODate(...)                            │  │
│ └──────────────────────────────────────────────────────┘  │
│    ↑                                                        │
│    │ References                                             │
│    │                                                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Collection: messages                                 │  │
│ │ ┌──────────────────────────────────────────────────┐ │  │
│ │ │ _id: ObjectId(\"msg-1\")                         │ │  │
│ │ │ chat_id: ObjectId(\"chat-123\")                  │ │  │
│ │ │ role: \"user\"                                   │ │  │
│ │ │ content: \"What's our leave policy?\"            │ │  │
│ │ │ timestamp: ISODate(\"2024-03-22...\")           │ │  │
│ │ └──────────────────────────────────────────────────┘ │  │
│ │ ┌──────────────────────────────────────────────────┐ │  │
│ │ │ _id: ObjectId(\"msg-2\")                         │ │  │
│ │ │ chat_id: ObjectId(\"chat-123\")                  │ │  │
│ │ │ role: \"assistant\"                              │ │  │
│ │ │ content: \"Our company offers 20 days...\"      │ │  │
│ │ │ model_used: \"openrouter/claude-3.5-sonnet\"    │ │  │
│ │ │ response_time: 1.234                             │ │  │
│ │ │ sources: [                                        │ │  │
│ │ │   {                                               │ │  │
│ │ │     \"document_id\": \"uuid-123\",                │ │  │
│ │ │     \"filename\": \"employee_handbook.pdf\",      │ │  │
│ │ │     \"similarity_score\": 0.92,                   │ │  │
│ │ │     \"chunk_text\": \"20 days annual...\"         │ │  │
│ │ │   }                                               │ │  │
│ │ │ ]                                                 │ │  │
│ │ │ timestamp: ISODate(\"2024-03-22...\")           │ │  │
│ │ └──────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
POSTGRESQL (Python RAG Service)
════════════════════════════════════════════════════════════════════

Table: documents
┌────────────────────────────────────────────────────────────┐
│ id (UUID)          | 550e8400-e291-11d3-a756           │
│ company_id (TEXT)  | \"comp-aaa\" ← ISOLATION KEY!      │
│ user_id (TEXT)     | \"user-amy\"                        │
│ filename (TEXT)    | \"employee_handbook.pdf\"           │
│ content (TEXT)     | \"Our company policies...\"         │
│ created_at (TS)    | 2024-03-22 10:30:00                │
└────────────────────────────────────────────────────────────┘
    ↑
    │ Foreign Key
    │
Table: document_chunks (with pgvector!)
┌────────────────────────────────────────────────────────────┐
│ id (UUID)            | 123e4567-e89b-12345-6789       │
│ company_id (TEXT)    | \"comp-aaa\" ← CRITICAL! ✅     │
│ document_id (UUID FK)| 550e8400-e291-11d3-a756       │
│ chunk_index (INT)    | 0                              │
│ chunk_text (TEXT)    | \"Leave policy: 20 days...\"   │
│ embedding (VECTOR)   | [0.12, -0.45, 0.78, ...] (1536)│
│ created_at (TS)      | 2024-03-22 10:30:30            │
│                       |                                 │
│ Indexes:                                               │
│ • idx_company_id: Fast filtering by company          │
│ • idx_embedding_cosine: Fast similarity search       │
│                                                        │
└────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════

KEY PRINCIPLE FOR MULTI-TENANCY:
Every query MUST filter by company_id!

❌ WRONG:
SELECT * FROM document_chunks WHERE chunk_text LIKE '%leave%';
(Could return other companies' data!)

✅ CORRECT:
SELECT * FROM document_chunks
WHERE company_id = \"comp-aaa\" AND chunk_text LIKE '%leave%';
(Only returns comp-aaa's chunks!)
```

---

## Configuration Quick Reference

```
PROJECT DIRECTORY STRUCTURE & CONFIGURATION FILES
═════════════════════════════════════════════════════════════

chatGPT_clone/
│
├─ backend/                          ← Go Backend
│  ├─ .env                           ← UPDATE: Add RAG_SERVICE_URL
│  │  ├─ MONGODB_URI=mongo...
│  │  ├─ FRONTEND_URL=http://3000
│  │  ├─ JWT_SECRET=xxx
│  │  ├─ RAG_SERVICE_URL=http://localhost:8000    ← NEW
│  │  └─ GEMINI_API_KEY=xxx          (keep as fallback)
│  │
│  ├─ main.go                        ← MODIFY: Add InitRAGClient()
│  ├─ go.mod                         (Dependencies)
│  │
│  ├─ services/
│  │  ├─ gemini_service.go           (Keep for fallback)
│  │  ├─ rag_client.go               ← CREATE NEW
│  │  ├─ chat_service.go
│  │  └─ document_service.go         ← CREATE NEW (Phase 2)
│  │
│  ├─ controllers/
│  │  ├─ chat_controller.go          ← MODIFY: Call RAG
│  │  └─ document_controller.go      ← MODIFY: Forward to RAG
│  │
│  ├─ models/
│  │  ├─ chat.go                     (Already has company_id ✓)
│  │  ├─ message.go                  (Already has sources support ✓)
│  │  └─ company.go
│  │
│  ├─ routes/
│  │  └─ routes.go                   (No changes needed ✓)
│  │
│  └─ config/
│     ├─ config.go
│     └─ database.go
│
├─ Enterprise-Assistant-Backend/     ← Python RAG Service
│  ├─ .env                           ← PREPARE: Set these
│  │  ├─ DATABASE_URL=postgresql://user:pass@localhost:5432/rag
│  │  ├─ OPENROUTER_API_KEY=sk-or-xxxxx
│  │  ├─ OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
│  │  ├─ EMBEDDING_MODEL=openrouter/...
│  │  └─ LLM_MODEL=openrouter/claude-3.5-sonnet
│  │
│  ├─ main.py                        (Already good ✓)
│  ├─ requirements.txt                (Already good ✓)
│  ├─ config.py                       (Already good ✓)
│  ├─ database.py                     (PostgreSQL connection ✓)
│  │
│  ├─ models/
│  │  ├─ document.py                 (company_id ✓)
│  │  └─ document_chunk.py           (company_id + embeddings ✓)
│  │
│  ├─ services/
│  │  ├─ llm_service.py              (OpenRouter - ready ✓)
│  │  ├─ embeddings.py               (Embeddings - ready ✓)
│  │  └─ chunking.py                 (Text split - ready ✓)
│  │
│  └─ routes/
│     ├─ document_routes.py          (Upload/manage ✓)
│     └─ query_routes.py             (RAG query ✓)
│
├─ frontend/                         ← React Frontend
│  ├─ .env
│  │  └─ REACT_APP_API_URL=http://localhost:8080
│  │
│  ├─ public/
│  │  └─ index.html
│  │
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ index.js
│  │  │
│  │  ├─ services/
│  │  │  ├─ chatAPI.js               ← MODIFY: Add uploadDocument()
│  │  │  └─ authAPI.js
│  │  │
│  │  └─ components/
│  │     └─ Chat/
│  │        ├─ ChatContainer.jsx
│  │        ├─ Message.jsx           ← MODIFY: Display sources
│  │        └─ MessageInput.jsx
│  │
│  ├─ package.json
│  └─ tailwind.config.js
│
├─ PROJECT_ANALYSIS.md               ← Detailed project breakdown
├─ INTEGRATION_GUIDE.md              ← Phase-by-phase guide
├─ CODE_IMPLEMENTATION.md            ← Copy-paste ready code
├─ SUMMARY.md                        ← This document!
└─ README.md                         ← Original project README

═════════════════════════════════════════════════════════════════════

Environment Variable Summary:

GO BACKEND (.env)
─────────────────────────────────────────────────────────────
MONGODB_URI          Required   Connection to MongoDB
FRONTEND_URL         Required   Where frontend is hosted
JWT_SECRET           Required   Signing JWT tokens
RAG_SERVICE_URL      Required   Python RAG endpoint
GEMINI_API_KEY       Optional   Fallback LLM

PYTHON RAG (.env)
─────────────────────────────────────────────────────────────
DATABASE_URL         Required   PostgreSQL connection
OPENROUTER_API_KEY   Required   API key for LLM/embeddings
OPENROUTER_BASE_URL  Required   OpenRouter endpoint
EMBEDDING_MODEL      Required   Which embedding model
LLM_MODEL            Required   Which LLM model

FRONTEND (.env)
─────────────────────────────────────────────────────────────
REACT_APP_API_URL    Required   Go backend URL
```

---

**Quick Reference Guide Complete!**

Use this alongside the implementation code in `CODE_IMPLEMENTATION.md`
