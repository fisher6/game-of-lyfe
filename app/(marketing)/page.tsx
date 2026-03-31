"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-100 px-6 py-16 dark:bg-zinc-950">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Resume project
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Game of Lyfe
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Grow up from age eight with health, happiness, and money on the line.
          Pick school paths, social media moments, college or work — a small
          demo you can extend into a full life sim.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
      </div>
    </div>
  );
}
