import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIResponse, detectLanguage, detectLanguageAndTranslate, transcribeAudio } from "./openai";
import { engine } from "./resources/engine";
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
      const { content } = z.object({ content: z.string() }).parse(req.body);
      
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
      const engineResult = await aiEngine.run(content, engineInput);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
