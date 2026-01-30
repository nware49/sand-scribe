import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Message Queue API
  
  // Send a new message (from sender's phone)
  app.post("/api/messages", async (req, res) => {
    try {
      const result = insertMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid message data", details: result.error.issues });
      }
      
      const message = await storage.createMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Get pending messages (for receiver to fetch and send to device)
  app.get("/api/messages/pending", async (req, res) => {
    try {
      const messages = await storage.getPendingMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching pending messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get delivered messages (history)
  app.get("/api/messages/delivered", async (req, res) => {
    try {
      const messages = await storage.getDeliveredMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching delivered messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Mark a message as delivered (after receiver sends to BLE device)
  app.patch("/api/messages/:id/deliver", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }
      
      const message = await storage.markMessageDelivered(id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error marking message delivered:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  // Get all messages (for viewing history)
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
