# Implementation Guide - Intelligent Enterprise Assistant

## Quick Start Guide

### Step 1: Clone and Setup

```bash
# Navigate to your project directory
cd /home/premkumar/Desktop/chatGPT_clone

# Install backend dependencies
cd backend
go mod tidy

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration

Create or update `backend/.env`:

```env
PORT=8080
MONGODB_URI=mongodb+srv://premkumars:p2r0e0m5@cluster0.4prn00c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_key_change_this_in_production
GEMINI_API_KEY=AIzaSyCLXwlyDAGFOsx5ux0kd-ZX6xbwg2bSzwA
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

Update `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

### Step 3: Run the Application

#### Terminal 1 - Backend

```bash
cd backend
go run main.go
```

You should see:

```
Server started on :8080
Connected to MongoDB!
Gemini client initialized
```

#### Terminal 2 - Frontend

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## Key Features Implemented

### ✅ 1. Gemini AI Integration

- **Location**: `backend/services/gemini_service.go`
- **Features**:
  - System prompt for enterprise context
  - Chat history management
  - Document processing
  - Safety settings configured

### ✅ 2. Profanity Filter

- **Location**: `backend/services/gemini_service.go` (FilterProfanity function)
- **How it works**:
  - Checks message against dictionary
  - Replaces inappropriate words with asterisks
  - Logs filtered content

**To expand dictionary**: Edit the `profanityList` array in `gemini_service.go`

### ✅ 3. Document Processing

- **Backend**: `backend/controllers/document_controller.go`
- **Frontend**: `frontend/src/components/Chat/DocumentUpload.jsx`
- **Supported formats**: PDF, DOC, DOCX, TXT
- **Max size**: 10MB
- **Actions**: Summarize, Extract Keywords

### ✅ 4. Response Time Monitoring

- **Location**: `backend/controllers/chat_controller.go`
- **Implementation**:
  ```go
  startTime := time.Now()
  // ... process message ...
  responseTime := time.Since(startTime).Seconds()
  if responseTime > 5.0 {
      c.Logger().Warnf("Response time exceeded 5 seconds: %.2fs", responseTime)
  }
  ```
- Response time saved in database

### ✅ 5. Enhanced UI

- **Welcome Screen**: Shows features and example queries
- **Document Upload**: Drag-and-drop interface
- **Gemini Branding**: Shows "Gemini AI Assistant" in messages
- **Enterprise Theme**: Professional dark theme

## Testing the Features

### Test 1: Basic Chat

1. Register/Login to the app
2. Create a new chat
3. Ask: "What is the leave policy for employees?"
4. Verify: Response is contextual and professional

### Test 2: Document Upload

1. Prepare a test document (8-10 pages recommended)
2. Click the document icon in message input
3. Drag and drop or browse to select file
4. Choose "Summarize" action
5. Click "Upload and Process"
6. Verify: Summary appears in chat

### Test 3: Profanity Filter

1. Try sending a message with inappropriate language
2. Verify: Word is replaced with asterisks
3. Check backend logs for "Profanity detected and filtered"

### Test 4: Response Time

1. Send several messages
2. Check backend logs for response times
3. Verify: Times are logged and <5 seconds

### Test 5: IT Support Query

1. Ask: "How do I reset my password?"
2. Verify: Gets helpful, structured response

## Customization Guide

### Adding More Enterprise Context

Edit `backend/services/gemini_service.go`:

```go
const SystemPrompt = `You are an Intelligent Enterprise Assistant for [YOUR ORGANIZATION NAME].

Your specific knowledge includes:
1. HR Policies:
   - [Add specific policies]

2. IT Support:
   - [Add specific procedures]

3. Company Events:
   - [Add event calendar info]

[Add more context...]`
```

### Expanding Profanity Filter

Edit `backend/services/gemini_service.go`:

```go
profanityList := []string{
    "word1", "word2", "word3",
    // Add more words
}
```

### Adjusting Response Time Threshold

Edit `backend/controllers/chat_controller.go`:

```go
if responseTime > 5.0 { // Change 5.0 to your desired threshold
    c.Logger().Warnf("Response time exceeded threshold: %.2fs", responseTime)
}
```

### Customizing Document Processing

Edit `backend/controllers/document_controller.go`:

```go
// Add more actions
case "analyze":
    prompt = "Analyze this document for compliance and policy adherence."
case "translate":
    prompt = "Translate this document to [language]."
```

## Troubleshooting

### Issue: "Gemini API Error"

**Solution**:

- Check GEMINI_API_KEY in .env
- Verify API key is active at https://makersuite.google.com/app/apikey
- Check quota limits

### Issue: "MongoDB connection failed"

**Solution**:

- Verify MONGODB_URI in .env
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP

### Issue: Document upload fails

**Solution**:

- Check file size (<10MB)
- Verify file format (PDF, DOC, DOCX, TXT)
- Check backend logs for specific error

### Issue: Response time >5 seconds

**Possible causes**:

- Network latency
- Large document processing
- High Gemini API load
- Check logs for bottlenecks

## Performance Optimization

### Backend

1. **Enable caching** for frequently asked questions
2. **Database indexing** on chat_id and user_id
3. **Connection pooling** for MongoDB
4. **Rate limiting** to prevent abuse

### Frontend

1. **Code splitting** for faster load times
2. **Lazy loading** for images and components
3. **Memoization** for expensive computations
4. **WebSocket** for real-time updates (future)

## Security Best Practices

### Production Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add 2FA email verification
- [ ] Set up monitoring and logging
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Implement CORS properly
- [ ] Add input validation everywhere
- [ ] Set up backup strategies

### 2FA Implementation (TODO)

Location: `backend/controllers/auth_controller.go`

```go
// Add email sending logic
func sendVerificationEmail(email, code string) error {
    // Implement with SMTP or email service
}

// Add verification endpoint
func VerifyEmail(c echo.Context) error {
    // Verify the code sent to email
}
```

## Monitoring & Analytics

### Metrics to Track

1. **Response Times**: Average, P95, P99
2. **User Engagement**: Messages per session, active users
3. **Document Processing**: Success rate, processing time
4. **Error Rates**: API errors, validation failures
5. **Profanity Detection**: Frequency and patterns

### Logging

Check logs for:

- `INFO`: General operations
- `WARN`: Response time exceeded, profanity detected
- `ERROR`: API failures, database issues

## Deployment Guide

### Backend Deployment (Heroku/Railway/Render)

```bash
# Build binary
go build -o server main.go

# Set environment variables on platform
# Deploy using platform CLI or Git
```

### Frontend Deployment (Vercel/Netlify)

```bash
# Build production bundle
npm run build

# Deploy build folder to hosting platform
```

### Database (MongoDB Atlas)

- Already configured
- Set up automated backups
- Monitor performance metrics

## Next Steps

1. **Implement 2FA**: Add email verification
2. **Add WebSocket**: Real-time chat updates
3. **Analytics Dashboard**: Track usage and performance
4. **Voice Integration**: Speech-to-text for queries
5. **Multi-language**: Support multiple languages
6. **Mobile App**: React Native companion app
7. **Integration**: Connect to existing HR/IT systems
8. **Advanced Search**: Full-text search across chats
9. **Export**: Download chat history and documents
10. **Feedback System**: User ratings for responses

## SIH Hackathon Demo Tips

### 3-Minute Video Script

1. **0:00-0:30**: Introduction - Problem statement and solution overview
2. **0:30-1:00**: Show login and welcome screen
3. **1:00-1:30**: Demo HR policy query with fast response
4. **1:30-2:15**: Upload document and show processing
5. **2:15-2:45**: Show IT support query and profanity filter
6. **2:45-3:00**: Conclusion - tech stack and scalability

### Live Demo Checklist

- [ ] Backend running and healthy
- [ ] Frontend loads quickly
- [ ] Sample documents ready (HR policy, IT guide)
- [ ] Pre-registered test account
- [ ] Example queries prepared
- [ ] Network connectivity verified
- [ ] Backup plan if internet fails

## Support & Resources

- **Gemini AI Docs**: https://ai.google.dev/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Echo Framework**: https://echo.labstack.com
- **React Docs**: https://react.dev

## Contact

For issues or questions during hackathon, contact your team lead.

---

**Good luck with your SIH hackathon! 🚀**
