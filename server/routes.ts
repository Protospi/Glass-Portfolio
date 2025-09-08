import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIResponse, detectLanguage, detectLanguageAndTranslate } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {

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
