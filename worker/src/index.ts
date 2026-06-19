// Sand Scribe API — Cloudflare Worker
//
// Always-on, free-tier API backed by Neon Postgres. This is the production
// source of truth that both phones (sender + receiver) talk to. It mirrors the
// endpoints the local Express dev server exposes, but persists to a real
// database instead of in-memory storage.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { asc, desc, eq } from "drizzle-orm";

import { messages, insertMessageSchema } from "../../shared/schema";

type Bindings = {
  // Neon connection string, set via `wrangler secret put DATABASE_URL`.
  DATABASE_URL: string;
};

function getDb(env: Bindings) {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema: { messages } });
}

const app = new Hono<{ Bindings: Bindings }>();

// The native app doesn't enforce CORS, but this keeps Expo web / browser
// testing working against the deployed Worker.
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/", (c) => c.text("Sand Scribe API"));

// Queue a new message (from the sender's phone).
app.post("/api/messages", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = insertMessageSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Invalid message data", details: result.error.issues },
      400,
    );
  }

  const db = getDb(c.env);
  const [message] = await db
    .insert(messages)
    .values({
      text: result.data.text,
      senderName: result.data.senderName ?? "Anonymous",
    })
    .returning();

  return c.json(message, 201);
});

// Pending messages (for the receiver to fetch and send to the BLE device).
app.get("/api/messages/pending", async (c) => {
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.delivered, false))
    .orderBy(asc(messages.createdAt));
  return c.json(rows);
});

// Delivered messages (history).
app.get("/api/messages/delivered", async (c) => {
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.delivered, true))
    .orderBy(desc(messages.deliveredAt));
  return c.json(rows);
});

// Mark a message delivered (after the receiver writes it over BLE).
app.patch("/api/messages/:id/deliver", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid message ID" }, 400);
  }

  const db = getDb(c.env);
  const [message] = await db
    .update(messages)
    .set({ delivered: true, deliveredAt: new Date() })
    .where(eq(messages.id, id))
    .returning();

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json(message);
});

// All messages (history view).
app.get("/api/messages", async (c) => {
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt));
  return c.json(rows);
});

export default app;
