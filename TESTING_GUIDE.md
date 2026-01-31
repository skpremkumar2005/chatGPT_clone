# Quick Testing Guide 🧪

## Backend API Fix Verification

### 1. Restart Backend

```bash
cd backend
go run main.go
```

**Expected Output:**

```
Server started on port 8080
MongoDB connected
Gemini AI initialized
```

### 2. Test Message Endpoint

**Test Case 1: Simple Message**

```bash
# Get your chat ID first
curl http://localhost:8080/api/chats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send test message
curl -X POST http://localhost:8080/api/chats/YOUR_CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is the company sick leave policy?"}'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "role": "assistant",
    "content": "Based on our HR policies...",
    "response_time": 2.34,
    "model_used": "gemini-1.5-flash"
  }
}
```

**❌ Old Error (should NOT appear):**

```json
{
  "success": false,
  "message": "Failed to get response from AI"
}
```

### 3. Frontend Testing

**Test Case 2: Full UI Flow**

1. Open http://localhost:3000
2. Login with credentials
3. Click "New Conversation" button (center of header)
4. Type message: "What is the IT support process?"
5. Press Enter

**Expected Behavior:**

- ✅ Message appears with "You" label
- ✅ AI response appears with "AI Assistant" label (NOT "Gemini AI")
- ✅ Response time displayed (e.g., "2.34s")
- ✅ No errors in console

**Test Case 3: Profile & Settings**

1. Click user avatar (top right)
2. Click "Profile & Settings"
3. Verify modal opens
4. Switch between Profile/Settings tabs
5. Click outside or back arrow to close

**Expected Behavior:**

- ✅ Smooth modal animation
- ✅ Tabs switch instantly
- ✅ Form inputs are editable
- ✅ Toggles work in Settings tab

**Test Case 4: New Chat Button**

1. Click "New Conversation" in header
2. Verify new chat created in sidebar
3. Hover over button (observe rotation animation)

**Expected Behavior:**

- ✅ Plus icon rotates 90°
- ✅ Button scales up slightly
- ✅ Purple glow appears
- ✅ New chat appears in sidebar

### 4. Branding Check

**Search for "Gemini" in UI:**

```bash
cd frontend/src
grep -r "Gemini" --include="*.jsx" --include="*.js"
```

**Expected Result:**

- ❌ Should find ZERO matches (or only in comments/docs)

**Visual Check:**

- WelcomeScreen: "Enterprise AI Assistant" ✅
- Message labels: "AI Assistant" ✅
- MessageInput helper: "Enterprise AI Assistant" ✅
- Header subtitle: "Advanced AI Solutions" ✅

## Performance Benchmarks

### Response Time Requirements (SIH S0448)

- ✅ Target: <5 seconds
- ✅ Typical: 1-3 seconds
- ⚠️ Warning logged if >5s

**Test:**

```bash
# Send message and measure response time
time curl -X POST http://localhost:8080/api/chats/YOUR_CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Quick test"}'
```

### Document Processing

**Test Case 5: Upload Document**

```bash
curl -X POST http://localhost:8080/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test.pdf"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "processed_text": "Document content...",
    "page_count": 5
  }
}
```

## Common Issues & Solutions

### Issue 1: "Failed to get response from AI"

**Cause:** Old system prompt in history
**Solution:** Already fixed! Restart backend.

### Issue 2: Profile modal doesn't open

**Cause:** Import error
**Solution:** Ensure ProfileSettings.jsx exists in `frontend/src/components/Profile/`

### Issue 3: Icons not rendering

**Cause:** Missing heroicons package
**Solution:**

```bash
cd frontend
npm install @heroicons/react
```

### Issue 4: "createChat is not a function"

**Cause:** Missing Redux action
**Solution:** Check if `createChat` is exported in `chatSlice.js`

## Browser Console Checks

**No Errors Should Appear:**

```javascript
// Open DevTools (F12), check Console tab
// Should see:
✅ No red errors
✅ "Connected to WebSocket" (if implemented)
✅ Redux state updates
```

## Network Tab Verification

**Check API Calls:**

1. Open DevTools > Network
2. Send message
3. Look for: `POST /api/chats/{id}/messages`
4. Status should be: `200 OK`
5. Response time: <3000ms

## Mobile Responsiveness

**Test on Mobile (or resize browser):**

1. Resize to 375px width (iPhone SE)
2. Click hamburger menu (top left)
3. Sidebar slides out
4. All buttons are tappable (44x44px minimum)

## Accessibility Check

**Keyboard Navigation:**

1. Tab through all interactive elements
2. Press Enter on "New Conversation"
3. Press Escape to close profile modal
4. Use arrow keys in settings

## Final Checklist

- [ ] Backend starts without errors
- [ ] Messages send successfully
- [ ] AI responses received (<5s)
- [ ] No "Gemini" branding visible
- [ ] Profile modal opens/closes
- [ ] New chat button works
- [ ] User avatar shows correct initial
- [ ] Settings toggles work
- [ ] Mobile hamburger menu works
- [ ] No console errors

## Success Criteria ✅

**API Fix:**

- Messages return AI responses
- No "Failed to get response" errors
- Response times logged correctly

**UI Modernization:**

- Professional enterprise look
- All "Gemini" references removed
- Smooth animations (60fps)
- Responsive on all devices

**User Experience:**

- Intuitive navigation
- Clear visual feedback
- Fast interactions (<100ms)
- No confusion about features

---

**Status**: Ready for comprehensive testing
**Next Action**: Run backend, test message endpoint, verify UI
