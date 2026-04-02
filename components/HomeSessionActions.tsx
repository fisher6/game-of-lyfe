"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n/context";

export default function HomeSessionActions() {
  const { data: session, status } = useSession();
  const { t } = useLocale();

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
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/play" })}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {t("home.signInGoogle")}
          </button>
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
