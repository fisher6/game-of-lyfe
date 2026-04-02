"use client";

import { AppLogo } from "@/components/AppLogo";
import { HomeAuthSection } from "@/components/HomeAuthSection";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/context";

export function HomeLanding() {
  const { t } = useLocale();

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-100 px-6 py-16 dark:bg-zinc-950">
      <div className="absolute end-4 top-4 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="max-w-lg text-center">
        <div className="flex flex-col items-center gap-5">
          <AppLogo
            size={80}
            className="drop-shadow-md drop-shadow-violet-900/10 dark:drop-shadow-violet-950/40"
          />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {t("brand.shortTitle")}
          </h1>
        </div>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("home.blurb")}
        </p>

        <HomeAuthSection />
      </div>
    </div>
  );
}
