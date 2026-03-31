# Deploying Game of Lyfe on Vercel

## Environment variables

Add these in the Vercel project **Settings → Environment Variables** (Production and Preview):

| Name | Description |
|------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Vercel Postgres or Neon). |
| `AUTH_SECRET` | Random secret; generate locally with `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth **Client ID** (Web application). |
| `AUTH_GOOGLE_SECRET` | Google Cloud OAuth **Client secret**. |

Copy [.env.example](.env.example) for local development.

## Google OAuth redirect URIs

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 Client ID:

- **Authorized JavaScript origins**: `https://YOUR-DOMAIN.vercel.app` (and `http://localhost:3000` for local dev).
- **Authorized redirect URIs**:
  - `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`

## Build command

The default `npm run build` runs `prisma generate` and `next build`. **The database schema is not applied automatically** with that script.

For hosted Postgres (first deploy and whenever migrations change), set the Vercel **Build Command** to:

```bash
npm run vercel-build
```

That runs `prisma migrate deploy`, then `prisma generate`, then `next build`, so migrations apply before the app builds.

After the first successful deploy, you can keep using `npm run vercel-build` so new migrations always run.

## Connect the database

1. In Vercel, add **Postgres** (or connect Neon) and assign `DATABASE_URL` to the project.
2. Push this repo and import it in Vercel.
3. Set all env vars above.
4. Use build command `npm run vercel-build`.
5. Deploy.

Optional: add a custom domain and put that URL on your resume.
