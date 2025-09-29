import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIResponse, detectLanguage, detectLanguageAndTranslate, transcribeAudio, uploadFileToOpenAI } from "./openai";
import { engine } from "./resources/engine";
import { GoogleCalendarService } from "./google-calendar";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize engine instance
  const aiEngine = new engine();

  // Helper function to convert conversation history to engine format
  function convertHistoryToEngineFormat(messages: Array<{ content: string; isUser: boolean }>): any[] {
    const engineMessages: any[] = [];
    
    // Add system prompt first (this will be handled by engine if input.length === 0)
    // But if we have conversation history, we need to build the full context
    
    if (messages.length > 0) {
      // If we have conversation history, we need to include it all
      console.log('🔄 Converting conversation history to engine format:');
      for (const msg of messages) {
        const role = msg.isUser ? "user" : "assistant";
        console.log(`  - Converting [${role}]: ${msg.content.substring(0, 50)}...`);
        engineMessages.push({
          role: role,
          content: msg.content
        });
      }
      console.log('✅ Converted', messages.length, 'messages to engine format');
    } else {
      console.log('🆕 No conversation history - starting fresh');
    }
    
    return engineMessages;
  }

  // Configure multer for audio file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: 'uploads/',
      filename: (req, file, cb) => {
        // Ensure proper file extension for webm files
        const ext = file.mimetype === 'audio/webm' ? '.webm' : path.extname(file.originalname) || '.webm';
        cb(null, Date.now() + ext);
      }
    }),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept audio files
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Configure multer for document file uploads
  const fileUpload = multer({
    storage: multer.diskStorage({
      destination: 'uploads/',
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, Date.now() + ext);
      }
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for documents
    },
    fileFilter: (req, file, cb) => {
      // Accept common document formats
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'application/json',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only document files are allowed (PDF, TXT, DOC, DOCX, MD, JSON, CSV, XLS, XLSX)'));
      }
    }
  });

  // Audio transcription endpoint
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log('File received:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // Check if file exists
      if (!fs.existsSync(req.file.path)) {
        console.error('File does not exist at path:', req.file.path);
        return res.status(400).json({ error: "Audio file not found" });
      }

      // Transcribe the audio file
      const transcribedText = await transcribeAudio(req.file.path);
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      // Save the transcribed message as user input FIRST
      console.log('💾 About to save transcribed message:', transcribedText);
      const userMessage = await storage.createMessage({
        content: transcribedText.text,
        isUser: true,
      });
      console.log('✅ User message saved with ID:', userMessage.id);
      
      // Verify the message was saved by fetching it back
      const verifyMessages = await storage.getMessages();
      const savedUserMessage = verifyMessages.find(msg => msg.id === userMessage.id);
      console.log('🔍 Verification - User message found in storage:', !!savedUserMessage);
      
      // Get conversation history for context AFTER saving the user message
      const messages = await storage.getMessages();
      console.log('📚 Total messages in history (audio):', messages.length);
      console.log('🎤 Processing transcribed message:', transcribedText);
      
      // Convert conversation history to engine format (now includes the user's transcribed message)
      const engineInput = convertHistoryToEngineFormat(messages);
      console.log('🔄 Engine input length (audio):', engineInput.length);
      
      // Debug: Show recent conversation history
      console.log('📜 Recent conversation history (audio):');
      messages.slice(-5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.isUser ? 'User' : 'Assistant'}: ${msg.content.substring(0, 50)}...`);
      });
      
      // Debug: Show what we're passing to the engine
      console.log('🔧 Engine input preview:');
      engineInput.slice(-3).forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.role}]: ${msg.content.substring(0, 50)}...`);
      });
      
      // Generate AI response using the engine
      console.log('🚀 Calling engine with transcribed text:', transcribedText);
      const engineResult = await aiEngine.run(transcribedText.text, engineInput);
      
      // Extract the AI response from engine result
      // The engine returns the conversation array, find the last assistant message
      const lastAssistantMessage = engineResult
        .filter((msg: any) => msg.role === "assistant")
        .pop();
      
      // Debug the message structure
      console.log('🔍 Debug - Last assistant message (audio):', JSON.stringify(lastAssistantMessage, null, 2));
      
      // Extract the actual text content
      const aiResponse = lastAssistantMessage?.content || "I apologize, but I couldn't generate a response at the moment.";
      
      // Save the AI response as a message
      console.log('🤖 AI response to save (audio):', aiResponse.substring(0, 100) + '...');
      const responseMessage = await storage.createMessage({
        content: aiResponse,
        isUser: false,
      });
      
      res.json({
        transcribedText: transcribedText.text,
        userMessage,
        aiResponse: responseMessage
      });
    } catch (error) {
      // Clean up the temporary file in case of error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error("Audio transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // File upload endpoint
  app.post("/api/upload-file", fileUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      console.log('File received:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // Check if file exists
      if (!fs.existsSync(req.file.path)) {
        console.error('File does not exist at path:', req.file.path);
        return res.status(400).json({ error: "File not found" });
      }

      // Upload file to OpenAI
      const fileId = await uploadFileToOpenAI(req.file.path);
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      console.log('File uploaded to OpenAI with ID:', fileId);
      
      res.json({
        fileId,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      // Clean up the temporary file in case of error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Detect language and translate interface
  app.post("/api/language-detection", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const result = await detectLanguageAndTranslate(text);
      res.json(result);
    } catch (error) {
      console.error("Language detection error:", error);
      res.status(500).json({ error: "Failed to detect language and translate interface" });
    }
  });


  // Get all messages
  app.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // Generate AI response for chat completion
  app.post("/api/chat/completion", async (req, res) => {
    try {
      const { content, fileId } = z.object({ 
        content: z.string(),
        fileId: z.string().optional()
      }).parse(req.body);
      
      // Small delay to ensure user message is saved (race condition fix)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get conversation history for context (user message should already be saved by frontend)
      const messages = await storage.getMessages();
      console.log('📚 Total messages in history:', messages.length);
      console.log('💬 Processing user message:', content);
      
      // Convert conversation history to engine format
      const engineInput = convertHistoryToEngineFormat(messages);
      console.log('🔄 Engine input length:', engineInput.length);
      
      // Debug: Show recent conversation history
      console.log('📜 Recent conversation history:');
      messages.slice(-5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.isUser ? 'User' : 'Assistant'}: ${msg.content.substring(0, 50)}...`);
      });
      
      // Generate AI response using the engine
      // If fileId is provided, we need to modify the engine input to include file information
      let engineResult;
      if (fileId) {
        console.log('📎 File attached with ID:', fileId);
        // For now, we'll add file information to the user message
        // The engine will need to be updated to handle file content in the future
        const fileMessage = `[File attached: ${fileId}] ${content}`;
        engineResult = await aiEngine.run(fileMessage, engineInput);
      } else {
        engineResult = await aiEngine.run(content, engineInput);
      }
      
      // Extract the AI response from engine result
      // The engine returns the conversation array, find the last assistant message
      const lastAssistantMessage = engineResult
        .filter((msg: any) => msg.role === "assistant")
        .pop();
      
      // Debug the message structure
      console.log('🔍 Debug - Last assistant message:', JSON.stringify(lastAssistantMessage, null, 2));
      
      // Extract the actual text content
      const responseText = lastAssistantMessage?.content || 
        "I apologize, but I couldn't generate a response at the moment.";
      
      // Save the AI response as a message
      const responseMessage = await storage.createMessage({
        content: responseText,
        isUser: false,
      });
      console.log('🤖 AI response saved:', responseText.substring(0, 100) + '...');
      
      res.json(responseMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Chat completion error:", error);
        res.status(500).json({ message: "Failed to generate AI response" });
      }
    }
  });

  // Delete all messages (clear conversation)
  app.delete("/api/messages", async (_req, res) => {
    try {
      await storage.clearMessages();
      res.json({ message: "All messages cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Google Calendar OAuth setup routes
  app.get("/api/auth/google", async (_req, res) => {
    try {
      const calendarService = new GoogleCalendarService(true);
      const authUrl = calendarService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("OAuth URL generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate OAuth URL";
      
      // Send detailed error response for OAuth setup issues
      if (errorMessage.includes('Missing Google OAuth credentials')) {
        res.status(400).json({ 
          error: "OAuth not configured", 
          message: errorMessage,
          setupInstructions: {
            step1: "Create a .env file in your project root",
            step2: "Add Google OAuth credentials from Google Cloud Console",
            step3: "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET",
            step4: "Restart your server and try again",
            guide: "Check CALENDAR_SETUP.md for detailed instructions"
          }
        });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.get("/auth/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #d32f2f;">❌ Authorization Failed</h1>
                <p>Authorization code not provided. Please try the authorization process again.</p>
                <a href="/booking" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Back to Booking</a>
              </div>
            </body>
          </html>
        `);
      }

      const calendarService = new GoogleCalendarService(true);
      await calendarService.setAuthCode(code as string);
      
      // Get the tokens to display
      const auth = (calendarService as any).auth;
      const credentials = auth.credentials;
      
      console.log('\n🎉 OAUTH SETUP SUCCESSFUL! 🎉');
      console.log('=================================');
      console.log('✅ Refresh Token:', credentials.refresh_token);
      console.log('✅ Access Token:', credentials.access_token);
      console.log('\n📝 Add this to your .env file:');
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${credentials.refresh_token}`);
      console.log('=================================\n');
      
      res.send(`
        <html>
          <head>
            <title>OAuth Setup Complete</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #2e7d32; }
              .token-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; word-break: break-all; }
              .copy-btn { background: #1976d2; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
              .copy-btn:hover { background: #1565c0; }
              .step { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">🎉 OAuth Setup Complete!</h1>
              <p>Your Google Calendar integration is now authorized and ready to use.</p>
              
              <div class="step">
                <h3>📝 Step 1: Copy your refresh token</h3>
                <p>Add this line to your <code>.env</code> file:</p>
                <div class="token-box">
                  <strong>GOOGLE_OAUTH_REFRESH_TOKEN=</strong>${credentials.refresh_token}
                  <button class="copy-btn" onclick="navigator.clipboard.writeText('GOOGLE_OAUTH_REFRESH_TOKEN=${credentials.refresh_token}')">Copy</button>
                </div>
              </div>
              
              <div class="step">
                <h3>🔄 Step 2: Restart your server</h3>
                <p>After adding the refresh token to your .env file, restart your server for the changes to take effect.</p>
              </div>
              
              <div class="step">
                <h3>✅ Step 3: Test the booking system</h3>
                <p>Your calendar integration is now ready!</p>
                <a href="/booking" style="background: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
                  🗓️ Test Booking Page
                </a>
              </div>
              
              <hr style="margin: 30px 0;">
              <h3>🔧 Technical Details</h3>
              <p><strong>Access Token:</strong> <code>${credentials.access_token?.substring(0, 20)}...</code></p>
              <p><strong>Token Type:</strong> ${credentials.token_type || 'Bearer'}</p>
              <p><strong>Expires:</strong> ${credentials.expiry_date ? new Date(credentials.expiry_date).toLocaleString() : 'N/A'}</p>
            </div>
            
            <script>
              // Auto-scroll to top
              window.scrollTo(0, 0);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #d32f2f;">❌ Authorization Failed</h1>
              <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
              <p>Please check your server logs for more details and try again.</p>
              <a href="/booking" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Back to Booking</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Calendar availability check endpoint
  app.get("/api/calendar/availability", async (req, res) => {
    try {
      const { date, duration = 60 } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD format)" });
      }

      const calendarService = new GoogleCalendarService(true);
      const availability = await calendarService.findAvailableSlots({
        date: date as string,
        duration: parseInt(duration as string),
        workingHoursStart: "09:00",
        workingHoursEnd: "18:00"
      });

      res.json({ availability });
    } catch (error) {
      console.error("Calendar availability error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check calendar availability";
      
      // Provide helpful error messages for common OAuth issues
      if (errorMessage.includes('OAuth')) {
        res.status(401).json({ 
          error: "OAuth not configured or expired", 
          message: errorMessage,
          action: "Please complete OAuth setup first"
        });
      } else if (errorMessage.includes('invalid_grant')) {
        res.status(401).json({ 
          error: "OAuth token expired or invalid", 
          message: "Your refresh token has expired or is invalid",
          action: "Please re-authorize your application by visiting /api/auth/google"
        });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
