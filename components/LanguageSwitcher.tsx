"use client";

import { useLocale } from "@/lib/i18n/context";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  const btn =
    "rounded-lg px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm";
  const active =
    "bg-violet-600 text-white shadow-sm dark:bg-violet-500";
  const idle =
    "border border-zinc-300 bg-white/80 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <div
      className={className}
      dir="ltr"
      role="group"
      aria-label={t("lang.switchLabel")}
    >
      <div className="inline-flex gap-1 rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-1 dark:border-zinc-700 dark:bg-zinc-900/60">
        <button
          type="button"
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
          className={`${btn} ${locale === "en" ? active : idle}`}
        >
          {t("lang.english")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("he")}
          aria-pressed={locale === "he"}
          className={`${btn} ${locale === "he" ? active : idle}`}
        >
          {t("lang.hebrew")}
        </button>
      </div>
    </div>
  );
}
