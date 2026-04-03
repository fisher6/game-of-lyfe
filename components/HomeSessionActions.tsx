"use client";

import Link from "next/link";
import { useId } from "react";
import { signIn, useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n/context";

export default function HomeSessionActions() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const guestSaveHintId = useId();

  return (
    <>
      <div className="mt-10 flex min-h-12 flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {status === "loading" ? (
          <p className="text-sm text-zinc-500">{t("home.loading")}</p>
        ) : session ? (
          <Link
            href="/play"
            className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
          >
            {t("home.continue")}
          </Link>
        ) : (
          <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:mx-auto">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/play" })}
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {t("home.signInGoogle")}
            </button>
            <div className="group relative">
              <Link
                href="/play"
                title={t("home.guestSaveWarning")}
                aria-describedby={guestSaveHintId}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              >
                {t("home.playWithoutSignIn")}
              </Link>
              <span
                id={guestSaveHintId}
                className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-center text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {t("home.guestSaveWarning")}
              </span>
            </div>
          </div>
        )}
      </div>

      {session && (
        <p className="mt-6 text-sm text-zinc-500">
          {t("home.signedInAs", { email: session.user?.email ?? "" })}
        </p>
      )}
    </>
  );
}
