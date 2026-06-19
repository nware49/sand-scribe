// Export every message from the Neon database into a JSON backup and a
// human-readable Markdown archive. Run by the nightly GitHub Action, which
// then commits the output into a private backup repo.
//
// Requires DATABASE_URL in the environment and @neondatabase/serverless
// installed (the workflow installs it on the fly).

import { mkdirSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const rows = await sql`
  SELECT id, text, sender_name, created_at, delivered, delivered_at
  FROM messages
  ORDER BY created_at ASC
`;

mkdirSync("backup", { recursive: true });

// Machine-readable backup.
writeFileSync("backup/messages.json", JSON.stringify(rows, null, 2) + "\n");

// Human-readable archive.
const lines = [
  "# Sand Scribe — Message Archive",
  "",
  `_Last updated: ${new Date().toISOString()}_`,
  "",
  `Total messages: ${rows.length}`,
  "",
];

for (const m of rows) {
  const created = m.created_at ? new Date(m.created_at).toLocaleString() : "";
  const deliveredAt = m.delivered_at
    ? new Date(m.delivered_at).toLocaleString()
    : "";
  const quoted = String(m.text ?? "").replace(/\n/g, "\n> ");

  lines.push(`## #${m.id} — ${created}`);
  lines.push("");
  lines.push(`> ${quoted}`);
  lines.push("");
  lines.push(`- From: ${m.sender_name ?? "Anonymous"}`);
  lines.push(
    `- Delivered: ${m.delivered ? `yes${deliveredAt ? ` (${deliveredAt})` : ""}` : "no"}`,
  );
  lines.push("");
}

writeFileSync("backup/messages.md", lines.join("\n"));

console.log(`Backed up ${rows.length} messages to backup/`);
