# MongoDB Analytics Implementation

## Overview
This implementation adds transparent MongoDB analytics recording to the existing in-memory storage system without breaking any current functionality.

## What Was Implemented

### 1. **Automatic Message Recording** (`storage.ts`)
- Every message (user and assistant) is automatically recorded to MongoDB
- Messages are linked to users and conversations
- Token counts are estimated and tracked
- Recording happens in the background (non-blocking)

### 2. **User Tracking by IP**
- Users are identified and tracked by IP address
- Currently using test IP: `201.17.159.166`
- Unique users are created automatically on first interaction
- Future: Will be replaced with real IP tracking from requests

### 3. **Conversation Management**
- Conversations automatically group messages within a 24-hour window
- After 24 hours of inactivity, a new conversation is created
- Each conversation tracks total input/output tokens
- Conversations are linked to users

### 4. **Function Call Recording** (`engine.ts`)
- All function/tool calls are recorded to MongoDB
- Records function name, arguments, and responses
- Linked to the current conversation
- Token usage is tracked and aggregated

### 5. **Data Structure**
```
MongoDB Collections:
├── users
│   ├── _id (ObjectId)
│   ├── name
│   ├── email
│   ├── ip (unique identifier)
│   ├── inputTokens
│   ├── outputTokens
│   └── createdAt
│
├── conversations
│   ├── _id (ObjectId)
│   ├── userId (reference)
│   ├── title
│   ├── inputTokens
│   ├── outputTokens
│   ├── lastMessageAt
│   └── createdAt
│
├── messages
│   ├── _id (ObjectId)
│   ├── userId (reference)
│   ├── conversationId (reference)
│   ├── text
│   ├── author (user/assistant)
│   ├── inputTokens
│   ├── outputTokens
│   └── createdAt
│
└── functions
    ├── _id (ObjectId)
    ├── userId (reference)
    ├── conversationId (reference)
    ├── args
    ├── response
    ├── inputTokens
    ├── outputTokens
    └── createdAt
```

## Key Features

### ✅ Non-Breaking Implementation
- The existing in-memory storage continues to work exactly as before
- MongoDB recording happens asynchronously in the background
- If MongoDB fails, the app continues to function normally
- All errors are caught and logged without disrupting the user experience

### ✅ Automatic Tracking
- No manual intervention needed
- Messages are automatically recorded when created
- Function calls are automatically logged when executed
- Conversations auto-expire after 24 hours

### ✅ Token Usage Tracking
- Estimated token counts for all messages (rough estimate: 1 token ≈ 4 characters)
- Function call token usage tracked
- Conversation-level token aggregation
- User-level token totals

## How to Test

### 1. Start a Conversation
```bash
# Send a message via the chat interface or API
POST /api/messages
{
  "content": "Hello, how are you?",
  "isUser": true
}
```

### 2. Check MongoDB Collections
```javascript
// In MongoDB Compass or shell
db.users.find({ ip: "201.17.159.166" })
db.conversations.find({})
db.messages.find({})
db.functions.find({})
```

### 3. Test Function Calls
```bash
# Ask the assistant to use a tool
"Can you get information about project 1?"
# or
"Schedule a meeting for tomorrow at 2pm"
```

### 4. Test Conversation Expiry
```bash
# Clear messages (forces new conversation)
DELETE /api/messages

# Or wait 24 hours and send another message
# A new conversation will be automatically created
```

### 5. Use Existing Test Route
```bash
# Create sample data for testing
POST /api/analytics/test/create-samples
```

## Console Logs to Watch For

### Message Recording:
```
📊 Analytics - Found existing user: [userId]
📊 Analytics - Using existing conversation: [conversationId]
📊 Analytics - Message recorded to MongoDB
```

### Function Call Recording:
```
📊 Analytics - Function call recorded: [functionName]
```

### New Conversation:
```
📊 Analytics - Previous conversation expired (>24h)
📊 Analytics - Created new conversation: [conversationId]
```

### New User:
```
📊 Analytics - Created new user: [userId]
```

## Future Enhancements

### TODO: Real IP Tracking
Replace the test IP with actual user IP from requests:
```typescript
// In storage.ts, modify TEST_USER_IP usage
// Get IP from req.ip or req.headers['x-forwarded-for']
```

### TODO: Better Token Estimation
Replace the character-based estimation with actual OpenAI token counts:
```typescript
// Use tiktoken or OpenAI's token counting API
import { encoding_for_model } from 'tiktoken';
```

### TODO: User Session Management
Track user sessions and associate with browser fingerprints or session IDs.

### TODO: Analytics Dashboard
Create visualizations for:
- Daily active users
- Message volume
- Function call frequency
- Token usage trends
- Conversation duration

## Files Modified

1. **`server/storage.ts`** - Added MongoDB recording methods
2. **`server/resources/engine.ts`** - Added function call recording

## Notes

- All MongoDB operations are non-blocking
- Errors in analytics recording don't affect app functionality
- The test IP (201.17.159.166) will be replaced with real IP tracking
- Token counts are estimates and should be replaced with accurate counts from OpenAI

