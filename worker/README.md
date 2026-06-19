# Sand Scribe API (Cloudflare Worker)

The always-on, free-tier production API that both phones talk to. Backed by
**Neon** (serverless Postgres). Mirrors the local Express dev server's
`/api/messages*` endpoints but persists to a real database.

## One-time setup

### 1. Create the Neon database (free)

1. Sign up at https://neon.tech and create a project.
2. Copy the connection string (looks like
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`).

### 2. Create the tables

From the **repo root** (not this folder), with the Neon URL in your env:

```bash
DATABASE_URL="postgresql://...neon.tech/...?sslmode=require" npm run db:push
```

This uses the existing `drizzle.config.ts` + `shared/schema.ts` to create the
`messages` and `users` tables on Neon.

### 3. Deploy the Worker

```bash
npm install                             # from the REPO ROOT first — installs
                                        # drizzle-orm + @neondatabase/serverless
cd worker
npm install
npx wrangler login                      # opens browser, free Cloudflare account
npx wrangler secret put DATABASE_URL    # paste the Neon connection string
npx wrangler deploy
```

> The Worker bundles `drizzle-orm` and `@neondatabase/serverless` from the
> **root** `node_modules` (they're shared with the schema, so they live at the
> root to avoid duplicate-copy issues). Always run `npm install` at the repo
> root before deploying, not just inside `worker/`.

Wrangler prints your URL, e.g. `https://sand-scribe-api.<your-subdomain>.workers.dev`.
Test it: `curl https://sand-scribe-api.<your-subdomain>.workers.dev/api/messages`
should return `[]`.

### 4. Point the app at the Worker

In `eas.json`, replace `sand-scribe-api.YOUR-SUBDOMAIN.workers.dev` (in all three
build profiles) with your real Worker host — **no `https://`, no trailing slash**.
Then rebuild: `eas build --profile production --platform ios`.

## Local development

```bash
cd worker
npx wrangler dev   # runs the Worker locally; needs DATABASE_URL in .dev.vars
```

Create `worker/.dev.vars` (gitignored) with `DATABASE_URL=...` for local runs.

## Nightly backup

The `.github/workflows/backup-messages.yml` workflow exports all messages to a
**private** repo as JSON + Markdown. It needs, in this repo's settings:

- Secret `DATABASE_URL` — the Neon connection string.
- Secret `BACKUP_TOKEN` — a GitHub token with write access to the backup repo.
- Variable `BACKUP_REPO` — e.g. `nware49/sand-scribe-backups` (create it private first).
