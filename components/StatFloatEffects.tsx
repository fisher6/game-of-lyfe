"use client";

import { useMemo } from "react";
import type { StatDiffSummary } from "@/lib/game/engine";
import { useLocale } from "@/lib/i18n/context";
import type { AppLocale } from "@/lib/i18n/types";

type BurstItem = {
  key: string;
  emoji: string;
  /** Matches StatBars wording */
  name: string;
  formatted: string;
  delta: number;
  accent: "emerald" | "amber" | "violet" | "sky" | "zinc" | "cyan" | "rose";
};

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function formatAssetsDelta(n: number, locale: string): string {
  const abs = Math.abs(n).toLocaleString(locale);
  return n > 0 ? `+$${abs}` : `-$${abs}`;
}

function buildBurst(
  diff: StatDiffSummary,
  t: (k: string) => string,
  numberLocale: string,
  locale: AppLocale,
): BurstItem[] {
  const items: BurstItem[] = [];

  if (diff.age !== 0) {
    items.push({
      key: "age",
      emoji: diff.age > 0 ? "🎂" : "⏪",
      name: t("stat.age"),
      formatted: formatSigned(diff.age),
      delta: diff.age,
      accent: "zinc",
    });
  }
  if (Math.abs(diff.heightInches) >= 0.05) {
    let formatted: string;
    if (locale === "he") {
      const dCm = diff.heightInches * 2.54;
      const n = Math.round(dCm * 10) / 10;
      formatted = `${n > 0 ? "+" : ""}${n.toFixed(1)} ${t("stat.cmAbbr")}`;
    } else {
      const n = Math.round(diff.heightInches * 10) / 10;
      formatted = `${n > 0 ? "+" : ""}${n.toFixed(1)} ${t("stat.inAbbr")}`;
    }
    items.push({
      key: "height",
      emoji: diff.heightInches > 0 ? "📏" : "📐",
      name: t("stat.height"),
      formatted,
      delta: diff.heightInches,
      accent: "zinc",
    });
  }
  if (Math.abs(diff.weightLbs) >= 0.05) {
    let formatted: string;
    if (locale === "he") {
      const dKg = diff.weightLbs / 2.20462262;
      const n = Math.round(dKg * 10) / 10;
      formatted = `${n > 0 ? "+" : ""}${n.toFixed(1)} ${t("life.unitKg")}`;
    } else {
      const n = Math.round(diff.weightLbs * 10) / 10;
      formatted = `${n > 0 ? "+" : ""}${n.toFixed(1)} ${t("life.lb")}`;
    }
    items.push({
      key: "weight",
      emoji: "⚖️",
      name: t("stat.weight"),
      formatted,
      delta: diff.weightLbs,
      accent: "zinc",
    });
  }
  if (diff.health !== 0) {
    items.push({
      key: "health",
      emoji: diff.health > 0 ? "❤️" : "🤒",
      name: t("stat.health"),
      formatted: formatSigned(diff.health),
      delta: diff.health,
      accent: "emerald",
    });
  }
  if (diff.happiness !== 0) {
    items.push({
      key: "happiness",
      emoji: diff.happiness > 0 ? "😊" : "😔",
      name: t("stat.happiness"),
      formatted: formatSigned(diff.happiness),
      delta: diff.happiness,
      accent: "amber",
    });
  }
  if (diff.intelligence !== 0) {
    items.push({
      key: "intelligence",
      emoji: diff.intelligence > 0 ? "🧠" : "💭",
      name: t("stat.intelligence"),
      formatted: formatSigned(diff.intelligence),
      delta: diff.intelligence,
      accent: "violet",
    });
  }
  if (diff.socialSkill !== 0) {
    items.push({
      key: "socialSkill",
      emoji: diff.socialSkill > 0 ? "🤝" : "🫥",
      name: t("stat.social"),
      formatted: formatSigned(diff.socialSkill),
      delta: diff.socialSkill,
      accent: "cyan",
    });
  }
  if (diff.romanticSkill !== 0) {
    items.push({
      key: "romanticSkill",
      emoji: diff.romanticSkill > 0 ? "💞" : "💔",
      name: t("stat.romantic"),
      formatted: formatSigned(diff.romanticSkill),
      delta: diff.romanticSkill,
      accent: "rose",
    });
  }
  if (diff.assets !== 0) {
    items.push({
      key: "assets",
      emoji: diff.assets > 0 ? "💰" : "💸",
      name: t("stat.assets"),
      formatted: formatAssetsDelta(diff.assets, numberLocale),
      delta: diff.assets,
      accent: "sky",
    });
  }
  if (diff.debt !== 0) {
    items.push({
      key: "debt",
      emoji: diff.debt > 0 ? "📒" : "📉",
      name: t("stat.debt"),
      formatted: formatAssetsDelta(diff.debt, numberLocale),
      delta: diff.debt,
      accent: "rose",
    });
  }
  if (diff.legacyFamilyHarmony !== 0) {
    items.push({
      key: "lf",
      emoji: "🫶",
      name: t("stat.familyLegacy"),
      formatted: formatSigned(diff.legacyFamilyHarmony),
      delta: diff.legacyFamilyHarmony,
      accent: "amber",
    });
  }
  if (diff.legacyRepute !== 0) {
    items.push({
      key: "lr",
      emoji: "✨",
      name: t("stat.repute"),
      formatted: formatSigned(diff.legacyRepute),
      delta: diff.legacyRepute,
      accent: "violet",
    });
  }
  if (diff.legacyGenerosity !== 0) {
    items.push({
      key: "lg",
      emoji: "🎁",
      name: t("stat.generosity"),
      formatted: formatSigned(diff.legacyGenerosity),
      delta: diff.legacyGenerosity,
      accent: "emerald",
    });
  }
  if (diff.legacyHeirReadiness !== 0) {
    items.push({
      key: "lhro",
      emoji: "📜",
      name: t("stat.heirReadiness"),
      formatted: formatSigned(diff.legacyHeirReadiness),
      delta: diff.legacyHeirReadiness,
      accent: "cyan",
    });
  }
  if (diff.lifetimeDonatedTotal !== 0) {
    items.push({
      key: "don",
      emoji: "💝",
      name: t("stat.givenLifetime"),
      formatted: formatAssetsDelta(diff.lifetimeDonatedTotal, numberLocale),
      delta: diff.lifetimeDonatedTotal,
      accent: "sky",
    });
  }
  return items;
}

const STAGGER_MS = 220;

function accentClasses(accent: BurstItem["accent"]): string {
  switch (accent) {
    case "emerald":
      return "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40";
    case "amber":
      return "border-amber-200/80 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/40";
    case "violet":
      return "border-violet-200/80 bg-violet-50/90 dark:border-violet-900/50 dark:bg-violet-950/40";
    case "sky":
      return "border-sky-200/80 bg-sky-50/90 dark:border-sky-900/50 dark:bg-sky-950/40";
    case "cyan":
      return "border-cyan-200/80 bg-cyan-50/90 dark:border-cyan-900/50 dark:bg-cyan-950/40";
    case "rose":
      return "border-rose-200/80 bg-rose-50/90 dark:border-rose-900/50 dark:bg-rose-950/40";
    default:
      return "border-zinc-200/80 bg-zinc-100/90 dark:border-zinc-700 dark:bg-zinc-800/80";
  }
}

type StatFloatEffectsProps = {
  diff: StatDiffSummary | null;
};

export function StatFloatEffects({ diff }: StatFloatEffectsProps) {
  const { t, numberLocale, locale } = useLocale();
  const items = useMemo(
    () => (diff ? buildBurst(diff, t, numberLocale, locale) : []),
    [diff, t, numberLocale, locale],
  );

  if (items.length === 0) return null;

  return (
    <div
      className="animate-stat-panel-in pointer-events-none relative z-20 w-full min-w-0"
      role="status"
      aria-live="polite"
      aria-label={t("statFloat.aria")}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li
            key={`${item.key}-${i}`}
            className={`stat-delta-row flex items-center justify-between gap-1 rounded-md border px-1 py-1 sm:gap-1 sm:px-1.5 sm:py-1 ${accentClasses(item.accent)}`}
            style={{
              animationDelay: `${i * STAGGER_MS}ms`,
            }}
          >
            <span className="flex min-w-0 items-center gap-1 sm:gap-1">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/70 text-sm shadow-sm sm:h-[22px] sm:w-[22px] sm:text-base dark:bg-zinc-900/60"
                aria-hidden
              >
                {item.emoji}
              </span>
              <span className="truncate text-[9px] font-semibold leading-tight text-zinc-800 min-[520px]:text-[10px] dark:text-zinc-100">
                {item.name}
              </span>
            </span>
            <span
              className={`shrink-0 tabular-nums text-[10px] font-bold leading-none min-[520px]:text-xs ${
                item.key === "debt"
                  ? item.delta > 0
                    ? "text-rose-700 dark:text-rose-400"
                    : item.delta < 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  : item.key === "weight"
                    ? item.delta < 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : item.delta > 0
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-zinc-600 dark:text-zinc-400"
                  : item.delta > 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : item.delta < 0
                      ? "text-rose-700 dark:text-rose-400"
                      : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {item.formatted}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
