"use client";

import type { GameState } from "@/lib/game/types";
import {
  computeEstateSummary,
  computeLifeSuccessScore,
  DEATH_NODE_ID,
  getFamilySummaryLines,
  type FamilySummaryLine,
} from "@/lib/game/engine";
import { useLocale } from "@/lib/i18n/context";

type LifeReviewCardProps = {
  state: GameState;
};

function formatFamilyLine(
  line: FamilySummaryLine,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  switch (line.type) {
    case "partner":
      return t("family.partner");
    case "kids":
      return line.count === 1
        ? t("family.kids_one")
        : t("family.kids_many", { count: line.count });
    case "kids_vague":
      return t("family.kids_vague");
    case "grandkids":
      return line.count === 1
        ? t("family.grandkids_one")
        : t("family.grandkids_many", { count: line.count });
    case "no_kids_path":
      return t("family.no_kids_path");
    case "caregiving_parent":
      return t("family.caregiving_parent");
    case "estranged":
      return t("family.estranged");
    case "family_focus":
      return t("family.family_focus");
    case "empty":
      return t("family.empty");
  }
}

export function LifeReviewCard({ state }: LifeReviewCardProps) {
  const { t, numberLocale } = useLocale();
  const isDeath =
    state.gamePhase === "dead" || state.currentNodeId === DEATH_NODE_ID;
  const ls = computeLifeSuccessScore(state);
  const es = computeEstateSummary(state);
  const familyLines = getFamilySummaryLines(state).map((line) =>
    formatFamilyLine(line, t),
  );
  const pct = Math.round(es.charityFraction * 100);
  const bd = ls.breakdown;

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 text-left dark:border-zinc-700 dark:bg-zinc-900/50">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {isDeath ? t("review.legacyTitle") : t("review.builtTitle")}
        </h2>
        {isDeath ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("review.legacySub")}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("review.builtSub")}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-200">
          {t("review.success")}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-violet-900 dark:text-violet-100">
          {ls.score}
          <span className="text-base font-semibold text-violet-700/90 dark:text-violet-300/90">
            {t("review.outOf")}
          </span>
        </p>
        <p className="mt-1 text-sm font-medium text-violet-900 dark:text-violet-200">
          {t(`tier.${ls.tierKey}`)}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-violet-900/85 dark:text-violet-200/85">
          {t("review.formula")}
        </p>
        <ul className="mt-2 grid gap-1 text-[11px] text-violet-900/80 dark:text-violet-200/80 sm:grid-cols-2">
          <li>
            {t("review.break.happiness")}: {Math.round(bd.happiness)}
          </li>
          <li>
            {t("review.break.health")}: {Math.round(bd.health)}
          </li>
          <li>
            {t("review.break.legacy")}: {Math.round(bd.legacy)}
          </li>
          <li>
            {t("review.break.wealth")}: {Math.round(bd.wealth)}
          </li>
          <li>
            {t("review.break.generosity")}: {Math.round(bd.generosity)}
          </li>
          <li>
            {t("review.break.family")}: {Math.round(bd.familyAndLongevity)}
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("review.family")}
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
          {familyLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {isDeath || state.age >= 65 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("review.repTitle")}
          </h3>
          <p className="mt-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            {t("review.repIntro")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              {t("review.rep.harmony")}: {state.legacyFamilyHarmony}
            </li>
            <li>
              {t("review.rep.repute")}: {state.legacyRepute}
            </li>
            <li>
              {t("review.rep.generosity")}: {state.legacyGenerosity}
            </li>
            <li>
              {t("review.rep.heir")}: {state.legacyHeirReadiness}
            </li>
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("review.assets")}
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <span className="text-zinc-500">{t("review.estateNet")}</span>{" "}
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              ${es.estateGross.toLocaleString(numberLocale)}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">{t("review.toHeirs")}</span>{" "}
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              ${es.heirShare.toLocaleString(numberLocale)}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">
              {t("review.toCharity", { pct })}
            </span>{" "}
            <span className="font-semibold tabular-nums text-violet-700 dark:text-violet-300">
              ${es.charityShare.toLocaleString(numberLocale)}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">{t("review.lifetimeDonations")}</span>{" "}
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              $
              {state.lifetimeDonatedTotal.toLocaleString(numberLocale)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
