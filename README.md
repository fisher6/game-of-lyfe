# Game of Lyfe

A browser-based **life simulation**: you grow a character from childhood through adulthood, make yearly choices that shift stats (health, happiness, intelligence, social life, money, and more), and watch long-term outcomes like career, housing, family, and legacy. Progress is **saved per signed-in user** in the cloud.

**Language:** The UI defaults to **English on every page load**. **Hebrew** is available via the switcher (RTL layout, localized story and UI strings, Hebrew country names where applicable). The selected language applies only for the **current browser session** and is **not persisted** between visits, so each new load starts in English until you switch again.

**Live site:** [https://game-of-lyfe.vercel.app/](https://game-of-lyfe.vercel.app/)

- **`/play`** — main game (Google sign-in required). Same URL locally: `http://localhost:3000/play`.
- **`/play/admin`** — same signed-in save as `/play`, plus demo controls: **Skip ~10 yrs** (random auto-play forward) and **Undo** (step back through recent choices / skips / character setup). The path is a convenience only, not authentication.

**Story calendar year:** The game maps in-game aging to a simple timeline: **age 8** in the story is treated as **your device’s current calendar year** when you play, and each extra in-game year adds one calendar year.

- **Life panel** — the summary shows two labeled columns, **Age** and **Year**, with that implied year next to your current age.
- **Death memorial** — under the portrait, a line shows **age at death** and the same style of **calendar year**.

---

## Tech stack

### Frontend

- **[Next.js](https://nextjs.org/) 16** (App Router, React Server Components where applicable)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** (with PostCSS)
- **react-nice-avatar** for illustrated character avatars

### Backend (same Next.js app)

There is **no separate backend service**. Server-side behavior runs inside Next.js:

- **Route Handlers** — e.g. `app/api/auth/[...nextauth]/route.ts` for authentication callbacks
- **Server Actions** — e.g. `app/play/actions.ts` (`"use server"`) for loading, saving, and resetting game state after session checks

### Database

- **PostgreSQL**, hosted on **[Supabase](https://supabase.com/)** (connection via `DATABASE_URL`)
- **Prisma** 7 as the ORM (`schema.prisma`, migrations, generated client under `app/generated/prisma`)
- **`pg`** driver with **`@prisma/adapter-pg`** for database access

Main persisted models: **User**, **Account** / **Session** (Auth.js), and **GameSave** (JSON blob of game state per user).

### Authentication

- **[Auth.js](https://authjs.dev/)** (NextAuth v5 beta) — `auth.ts`, `components/Providers.tsx` (`SessionProvider`)
- **Google OAuth** as the sign-in provider (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`)
- **`@auth/prisma-adapter`** — users, accounts, and sessions stored in Postgres
- **Database sessions** (`strategy: "database"`), 30-day session lifetime

---

## Local development

```bash
npm install
# Copy .env.example → .env and fill DATABASE_URL, AUTH_SECRET, Google OAuth keys
npx prisma migrate dev   # apply migrations (first time / after schema changes)
npm run dev              # http://localhost:3000
```

See **[`.env.example`](.env.example)** for required environment variables.

---

## Deployment

The project is set up for **[Vercel](https://vercel.com/)**:

- **Build command (production):** `npm run vercel-build` — runs `prisma migrate deploy`, then `prisma generate`, then `next build` so the database schema is applied before the app builds.
- **Runtime env:** same variables as local (Postgres URL, `AUTH_SECRET`, Google OAuth, optional `AUTH_URL`).

Step-by-step Vercel + Supabase + Google OAuth setup (redirect URIs, `DATABASE_URL` notes, `/play/admin` demo tools, etc.) is documented in **[`VERCEL.md`](VERCEL.md)**.

---

## Project layout (high level)

| Area | Path |
|------|------|
| App routes & layouts | `app/` |
| Admin / demo play (`/play/admin`) | `app/play/admin/page.tsx` |
| UI components | `components/` |
| Game engine & types | `lib/game/` (includes `story-calendar-year.ts` for age ↔ year display) |
| Story content (English) | `content/nodes.json` |
| Hebrew story strings | `content/story-he.json` (built from `content/story-he-parts/` via `npm run merge-story-he`) |
| UI i18n | `lib/i18n/` |
| Prisma schema | `prisma/schema.prisma` |
| Auth config | `auth.ts` |

---

## License / status

Private project (`"private": true` in `package.json`). Adjust this section if you open-source the repo.
