# Deploying Game of Lyfe on Vercel

## Prereqs

- A Vercel account
- A Supabase project (Postgres)
- A Google Cloud OAuth Client (Web application)

## Environment variables

Add these in the Vercel project **Settings → Environment Variables** (Production and Preview):

| Name | Description |
|------|-------------|
| `DATABASE_URL` | Supabase **direct** Postgres connection string (see below). |
| `AUTH_SECRET` | Random secret; generate locally with `openssl rand -base64 32`. Required in production. |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth **Client ID** (Web application). |
| `AUTH_GOOGLE_SECRET` | Google Cloud **Client secret**. |
| `NEXT_PUBLIC_GAME_ADMIN_TOOLS` | Optional. Set to `1` to show the **Skip ~10 yrs** demo button on `/play`. Omit on production unless you want that exposed. Local dev shows it automatically. |

Copy [.env.example](.env.example) for local development.

## Supabase database URL

In Supabase: **Project Settings → Database → Connection string**.

- Use the **Direct connection** string (not the pooler) for `DATABASE_URL`.
- Make sure the password is URL-encoded if it contains special characters.

Why direct: the Vercel build runs `prisma migrate deploy`, which needs a normal Postgres connection.

## Google OAuth redirect URIs

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 Client ID:

- **Authorized JavaScript origins**:
  - `https://YOUR-PROJECT.vercel.app` (and your custom domain if you add one)
  - `http://localhost:3000` (local dev)
- **Authorized redirect URIs**:
  - `https://YOUR-PROJECT.vercel.app/api/auth/callback/google`
  - `https://YOUR-CUSTOM-DOMAIN/api/auth/callback/google` (if used)
  - `http://localhost:3000/api/auth/callback/google`

Tip: you can do the first deploy with the Vercel `.vercel.app` URL, then come back and add your custom domain redirect after.

## Build command

The default `npm run build` runs `prisma generate` and `next build`. **The database schema is not applied automatically** with that script.

For hosted Postgres (first deploy and whenever migrations change), set the Vercel **Build Command** to:

```bash
npm run vercel-build
```

That runs `prisma migrate deploy`, then `prisma generate`, then `next build`, so migrations apply before the app builds.

After the first successful deploy, you can keep using `npm run vercel-build` so new migrations always run.

## Deploy steps (Vercel)

1. Push your repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. In Vercel project settings:
   - Add the env vars listed above (Production and Preview).
   - Set **Build Command** to `npm run vercel-build`.
4. Deploy.
5. After deploy:
   - Visit `https://YOUR-PROJECT.vercel.app`
   - Click **Sign in** and confirm Google login succeeds
   - Open `/play` and confirm it creates a save (refresh page; progress should persist)

Optional: add a custom domain and put that URL on your resume.
