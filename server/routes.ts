import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIResponse, detectLanguage, detectLanguageAndTranslate, transcribeAudio } from "./openai";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {

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
      
      // Get conversation history for context
      const messages = await storage.getMessages();
      
      // Save the transcribed message as user input
      const userMessage = await storage.createMessage({
        content: transcribedText,
        isUser: true,
      });
      
      // Generate AI response using Pedro's persona
      const aiResponse = await generateAIResponse(transcribedText, messages);
      
      // Save the AI response as a message
      const responseMessage = await storage.createMessage({
        content: aiResponse,
        isUser: false,
      });
      
      res.json({
        transcribedText,
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
      
      // Get conversation history for context
      const messages = await storage.getMessages();
      
      // Generate AI response using Pedro's persona
      const aiResponse = await generateAIResponse(content, messages);
      
      // Save the AI response as a message
      const responseMessage = await storage.createMessage({
        content: aiResponse,
        isUser: false,
      });
      
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
