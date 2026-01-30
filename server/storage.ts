import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message queue methods
  createMessage(message: InsertMessage): Promise<Message>;
  getPendingMessages(): Promise<Message[]>;
  getDeliveredMessages(): Promise<Message[]>;
  markMessageDelivered(id: number): Promise<Message | undefined>;
  getAllMessages(): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<number, Message>;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.messageIdCounter = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      id,
      text: insertMessage.text,
      senderName: insertMessage.senderName ?? "Anonymous",
      createdAt: new Date(),
      delivered: false,
      deliveredAt: null,
    };
    this.messages.set(id, message);
    return message;
  }

  async getPendingMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => !msg.delivered)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getDeliveredMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.delivered)
      .sort((a, b) => (b.deliveredAt?.getTime() ?? 0) - (a.deliveredAt?.getTime() ?? 0));
  }

  async markMessageDelivered(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      message.delivered = true;
      message.deliveredAt = new Date();
      this.messages.set(id, message);
    }
    return message;
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
