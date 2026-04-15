# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-tenant B2B enterprise chat application (branded "Gemini Chat") where companies register and their admin users manage employees. Each company gets isolated chat/AI functionality powered by Google Gemini. There is also an optional Python-based "Enterprise Assistant" backend for RAG/document Q&A.

## Development Commands

### Backend (Go)
```bash
cd backend
go run main.go          # Start dev server on :8080
go build -o app .       # Build binary
go test ./...           # Run all tests
```

### Frontend (React)
```bash
cd frontend
npm start               # Dev server on :3000
npm run build           # Production build
npm test                # Run tests
```

## Environment Variables

### Backend (`backend/.env`)
```
PORT=8080
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:3000
ENTERPRISE_ASSISTANT_URL=http://localhost:8000        # Optional RAG backend
ENTERPRISE_ASSISTANT_DOCUMENTS_URL=http://localhost:8000  # Optional, defaults to above
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
```

## Architecture

### Multi-Tenancy Model
Every resource (users, chats, messages, roles, knowledge base documents) is scoped to a `company_id`. Email uniqueness is enforced per company, not globally. The JWT includes `company_id`, `role_name`, and a `permissions` array — all downstream authorization is permission-based, not role-name-based.

**Tenant isolation flow:** Company registers via `POST /api/companies/register` → system creates default roles (super_admin, company_admin, manager, employee) → admin user is created → admin invites/creates employees via `POST /api/admin/users`.

Public user self-registration (`POST /api/auth/register`) is intentionally disabled and returns a forbidden error — users must be created by admins.

### Authentication
JWT is stored in an **HTTP-only cookie** named `token` (not Authorization header). The `AuthMiddleware` reads this cookie, parses the JWT, and populates Go `context.Context` keys (`UserIDKey`, `CompanyIDKey`, `RoleNameKey`, `PermissionsKey`, `IsSuperAdminKey`, etc.) defined in [backend/middleware/auth.go](backend/middleware/auth.go).

Frontend reads auth state from Redux (`authSlice`) which is hydrated at startup via `loadUser()` dispatched in `App.jsx`.

### Permission System
Permissions are string constants defined in [backend/models/role.go](backend/models/role.go) (e.g., `manage:users`, `view:activity_logs`). Route-level enforcement uses `middleware.RequirePermission(models.PermissionXxx)`. Super admin routes use `middleware.RequireSuperAdmin()`. Company admin routes use `middleware.RequireCompanyAdmin()`.

Frontend mirrors this with a `<RequirePermission permission="...">` wrapper component.

### Backend Service Layer
[backend/services/init.go](backend/services/init.go) is the single initialization point — called from `main.go` after DB connects. It:
1. Binds all MongoDB collection vars (package-level in `services/`)
2. Creates DB indexes
3. Calls `InitGemini()` for the AI client
4. Calls `InitEnterpriseAssistantClient()` for the optional Python RAG service

Services communicate with MongoDB directly (no ORM). Collections are: `users`, `chats`, `messages`, `companies`, `roles`, `activity_logs`, `knowledge_base_documents`.

### Enterprise Assistant (RAG)
An optional Python microservice handles document ingestion and semantic search. The Go backend proxies to it via [backend/services/enterprise_assistant_client.go](backend/services/enterprise_assistant_client.go). Two endpoints:
- `POST /api/v1/query` — RAG query for chat responses
- `POST /api/v1/documents` — ingest a document

When `ENTERPRISE_ASSISTANT_URL` is not set, it defaults to `http://localhost:8000`.

### Frontend State (Redux)
State slices: `auth` (user, token status), `chat` (currentChat, chatHistory, isTyping), `ui` (sidebarOpen, theme). API calls go through Axios with `withCredentials: true` to send the cookie.

### Route Structure
- `/login`, `/register` — public
- `/*` — protected, renders `<Layout>` with `<ChatContainer>` / `chat/:chatId`
- `/admin/*` — protected + permission-gated admin panel (users, roles, companies, activity logs, knowledge base)
