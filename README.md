# Game of Lyfe

Life-sim demo: stats, branching choices, cloud saves (Google sign-in), and JSON-driven story content in [`content/nodes.json`](content/nodes.json).

## Local development

1. Copy [`.env.example`](.env.example) to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, and Google OAuth credentials.
2. Apply the database schema: `npx prisma migrate deploy` (requires a running Postgres).
3. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

See [VERCEL.md](VERCEL.md) for environment variables, Google redirect URIs, and the recommended `npm run vercel-build` command.
