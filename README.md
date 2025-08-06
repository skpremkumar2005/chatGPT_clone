# ChatGPT Clone Project Structure & Flow

## Project Overview
A full-stack chat application with React/Redux frontend, Go Echo backend, MongoDB for persistence, and Gemini API for AI responses.

## Project Structure

```
chatgpt-clone/
├── frontend/                   # React + Redux frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatContainer.jsx
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   └── Message.jsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── ChatHistory.jsx
│   │   │   │   └── NewChatButton.jsx
│   │   │   └── Layout/
│   │   │       ├── Header.jsx
│   │   │       └── Layout.jsx
│   │   ├── redux/              # Redux store and slices
│   │   │   ├── store.js
│   │   │   ├── slices/
│   │   │   │   ├── chatSlice.js
│   │   │   │   ├── uiSlice.js
│   │   │   │   └── authSlice.js
│   │   │   └── middleware/
│   │   │       └── apiMiddleware.js
│   │   ├── services/           # API services
│   │   │   ├── chatAPI.js
│   │   │   └── authAPI.js
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useChat.js
│   │   │   └── useWebSocket.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── styles/             # CSS/SCSS files
│   │   │   ├── global.css
│   │   │   └── components/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── backend/                    # Go Echo backend
│   ├── main.go
│   ├── config/
│   │   ├── config.go
│   │   └── database.go
│   ├── controllers/
│   │   ├── chat_controller.go
│   │   ├── auth_controller.go
│   │   └── user_controller.go
│   ├── models/
│   │   ├── chat.go
│   │   ├── message.go
│   │   └── user.go
│   ├── services/
│   │   ├── gemini_service.go
│   │   ├── chat_service.go
│   │   └── auth_service.go
│   ├── middleware/
│   │   ├── cors.go
│   │   ├── auth.go
│   │   └── logger.go
│   ├── routes/
│   │   └── routes.go
│   ├── utils/
│   │   ├── response.go
│   │   └── validation.go
│   ├── go.mod
│   ├── go.sum
│   └── .env
├── .gitignore
└── README.md
```

## Database Schema (MongoDB)

### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Chats Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "is_archived": "boolean"
}
```

### Messages Collection
```json
{
  "_id": "ObjectId",
  "chat_id": "ObjectId",
  "role": "string", // "user" or "assistant"
  "content": "string",
  "timestamp": "timestamp",
  "token_count": "number",
  "model_used": "string"
}
```

## Application Flow

### 1. Authentication Flow
```
User Registration/Login
    ↓
Generate JWT Token
    ↓
Store User Session
    ↓
Redirect to Chat Interface
```

### 2. Chat Creation Flow
```
User Clicks "New Chat"
    ↓
Frontend: Dispatch createNewChat action
    ↓
Backend: Create new chat document in MongoDB
    ↓
Return chat_id to frontend
    ↓
Redux: Update current chat state
    ↓
Clear message input and history display
```

### 3. Message Exchange Flow
```
User Types Message
    ↓
Frontend: Dispatch sendMessage action
    ↓
Redux: Add user message to state (optimistic update)
    ↓
Backend API: /api/chats/{chat_id}/messages
    ↓
Save user message to MongoDB
    ↓
Call Gemini API with message context
    ↓
Receive AI response from Gemini
    ↓
Save AI response to MongoDB
    ↓
Return AI response to frontend
    ↓
Redux: Update messages with AI response
    ↓
UI: Display AI response with typing animation
```

### 4. Chat History Flow
```
User Loads Application
    ↓
Frontend: Dispatch fetchChatHistory action
    ↓
Backend: Query user's chats from MongoDB
    ↓
Return chat list with titles and metadata
    ↓
Redux: Update chat history state
    ↓
Sidebar: Display chat history list
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Chat Management
- `GET /api/chats` - Get user's chat history
- `POST /api/chats` - Create new chat
- `GET /api/chats/{chat_id}` - Get specific chat
- `DELETE /api/chats/{chat_id}` - Delete chat
- `PUT /api/chats/{chat_id}` - Update chat (rename)

### Messages
- `GET /api/chats/{chat_id}/messages` - Get chat messages
- `POST /api/chats/{chat_id}/messages` - Send new message
- `DELETE /api/messages/{message_id}` - Delete message

## Redux State Structure

```javascript
{
  auth: {
    user: null | UserObject,
    token: string | null,
    isAuthenticated: boolean,
    loading: boolean,
    error: string | null
  },
  chat: {
    currentChat: {
      id: string | null,
      title: string,
      messages: Message[]
    },
    chatHistory: Chat[],
    loading: boolean,
    error: string | null,
    isTyping: boolean
  },
  ui: {
    sidebarOpen: boolean,
    theme: 'light' | 'dark',
    isMobile: boolean
  }
}
```

## Key Components Implementation

### Frontend Technologies
- **React 18** with functional components and hooks
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for HTTP requests
- **Socket.io-client** (optional for real-time features)
- **Tailwind CSS** or **Material-UI** for styling

### Backend Technologies
- **Go Echo Framework** for REST API
- **MongoDB Driver** for Go
- **JWT-Go** for authentication
- **Gemini Go SDK** for AI integration
- **CORS middleware** for cross-origin requests

### Environment Variables

#### Backend (.env)
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/chatgpt_clone
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080
```

## Development Workflow

### 1. Setup Phase
1. Initialize Go module for backend
2. Create React app for frontend
3. Set up MongoDB (Docker or local)
4. Configure environment variables
5. Install dependencies

### 2. Backend Development
1. Set up database connection
2. Create models and schemas
3. Implement authentication middleware
4. Build API endpoints
5. Integrate Gemini API
6. Add error handling and validation

### 3. Frontend Development
1. Set up Redux store and slices
2. Create reusable components
3. Implement authentication flow
4. Build chat interface
5. Add real-time messaging
6. Style and responsive design

### 4. Integration
1. Connect frontend to backend APIs
2. Test authentication flow
3. Test chat functionality
4. Handle error states
5. Optimize performance

### Security Best Practices
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting
- Use secure JWT configuration
- Keep API keys secure and rotate regularly
- Implement proper CORS policies

This structure provides a solid foundation for your ChatGPT clone with proper separation of concerns, scalability, and maintainability.
