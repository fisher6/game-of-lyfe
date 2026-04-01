"use client";

import type { GameState } from "@/lib/game/types";
import {
  computeEstateSummary,
  computeLifeSuccessScore,
  DEATH_NODE_ID,
  describeLifeFamilySummary,
} from "@/lib/game/engine";

type LifeReviewCardProps = {
  state: GameState;
};

export function LifeReviewCard({ state }: LifeReviewCardProps) {
  const isDeath =
    state.gamePhase === "dead" || state.currentNodeId === DEATH_NODE_ID;
  const ls = computeLifeSuccessScore(state);
  const es = computeEstateSummary(state);
  const familyLines = describeLifeFamilySummary(state);
  const pct = Math.round(es.charityFraction * 100);
  const bd = ls.breakdown;

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-5 text-left dark:border-zinc-700 dark:bg-zinc-900/50">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {isDeath ? "Your legacy" : "What you built"}
        </h2>
        {isDeath ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            How you felt, who you showed up for, and what you gave — alongside
            what you kept.
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Overall score for this run (demo formula — not financial advice).
          </p>
        )}
      </div>

      <div className="rounded-xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-200">
          Life success
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-violet-900 dark:text-violet-100">
          {ls.score}
          <span className="text-base font-semibold text-violet-700/90 dark:text-violet-300/90">
            {" "}
            / 100
          </span>
        </p>
        <p className="mt-1 text-sm font-medium text-violet-900 dark:text-violet-200">
          {ls.tier}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-violet-900/85 dark:text-violet-200/85">
          Happiness is weighted highest (32%), then legacy vitals (20%),
          generosity (14%), family & years lived (13%), estate size (11%), and
          health (10%).
        </p>
        <ul className="mt-2 grid gap-1 text-[11px] text-violet-900/80 dark:text-violet-200/80 sm:grid-cols-2">
          <li>Happiness: {Math.round(bd.happiness)}</li>
          <li>Health: {Math.round(bd.health)}</li>
          <li>Legacy (avg): {Math.round(bd.legacy)}</li>
          <li>Wealth / estate: {Math.round(bd.wealth)}</li>
          <li>Generosity: {Math.round(bd.generosity)}</li>
          <li>Family & longevity: {Math.round(bd.familyAndLongevity)}</li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Family & relationships
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
            Reputation & legacy vitals
          </h3>
          <p className="mt-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            We now can track your legacy!
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Family harmony: {state.legacyFamilyHarmony}</li>
            <li>Repute: {state.legacyRepute}</li>
            <li>Generosity: {state.legacyGenerosity}</li>
            <li>Heir readiness: {state.legacyHeirReadiness}</li>
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Assets & giving
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <span className="text-zinc-500">Estate (net + home):</span>{" "}
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              ${es.estateGross.toLocaleString("en-US")}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">To heirs (approx.):</span>{" "}
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              ${es.heirShare.toLocaleString("en-US")}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">To charity (will, ~{pct}%):</span>{" "}
            <span className="font-semibold tabular-nums text-violet-700 dark:text-violet-300">
              ${es.charityShare.toLocaleString("en-US")}
            </span>
          </li>
          <li>
            <span className="text-zinc-500">Lifetime donations (tracked):</span>{" "}
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              ${state.lifetimeDonatedTotal.toLocaleString("en-US")}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
