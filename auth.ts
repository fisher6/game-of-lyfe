import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET automatically when you pass
 * `Google` without options. If we pass `Google({ clientId: "", ... })`, empty
 * strings overwrite those env values during merge → Google gets no client_id.
 *
 * So: only call `Google({...})` when both values are non-empty; otherwise use `Google`.
 */
const googleId =
  process.env.AUTH_GOOGLE_ID?.trim() ||
  process.env.GOOGLE_CLIENT_ID?.trim() ||
  "";
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET?.trim() ||
  process.env.GOOGLE_CLIENT_SECRET?.trim() ||
  "";

if (process.env.NODE_ENV === "development") {
  if (!googleId || !googleSecret) {
    console.warn(
      "[auth] Google OAuth: set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Restart `npm run dev` after saving."
    );
  }
}

const googleProvider =
  googleId && googleSecret
    ? Google({ clientId: googleId, clientSecret: googleSecret })
    : Google;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [googleProvider],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
