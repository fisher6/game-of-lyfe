"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export default function HomeSessionActions() {
  const { data: session, status } = useSession();

  return (
    <>
      <div className="mt-10 flex min-h-12 flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {status === "loading" ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : session ? (
          <Link
            href="/play"
            className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
          >
            Continue your life
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/play" })}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Sign in with Google
          </button>
        )}
      </div>

      {session && (
        <p className="mt-6 text-sm text-zinc-500">
          Signed in as {session.user?.email}
        </p>
      )}
    </>
  );
}
