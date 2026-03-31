"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { LegacyTrackingPanel } from "@/components/LegacyTrackingPanel";
import { LifeReviewCard } from "@/components/LifeReviewCard";
import { ACHIEVEMENTS, getAchievementMeta } from "@/lib/game/achievements";
import type { GameState, LanguageLevel } from "@/lib/game/types";
import { computeLifeSuccessScore } from "@/lib/game/engine";
import {
  RESIDENCE_NOMAD_ID,
  countryDisplayName,
  languageDisplayName,
  residenceDisplayLabel,
} from "@/lib/game/world";

function levelWord(l: LanguageLevel): string {
  if (l === "native") return "Native";
  if (l === "proficient") return "Proficient";
  if (l === "knowledgeable") return "Knowledgeable";
  return "Basic";
}

type DeathMemorialViewProps = {
  state: GameState;
  /** From the death node — shown as the narrative beat */
  epitaphTitle: string;
  epitaphBody: string;
  onPlayAgain: () => void;
  saving: boolean;
};

function deathCauseLabel(cause: string | undefined): string | null {
  if (!cause || !cause.trim()) return null;
  const c = cause.trim().toLowerCase();
  if (c === "health") return "Your health gave out.";
  if (c === "killed_in_service")
    return "Killed in military or national service.";
  return `Cause: ${cause.slice(0, 120)}`;
}

export function DeathMemorialView({
  state,
  epitaphTitle,
  epitaphBody,
  onPlayAgain,
  saving,
}: DeathMemorialViewProps) {
  const name = state.characterName.trim() || "You";
  const ls = computeLifeSuccessScore(state);
  const causeLine = deathCauseLabel(state.deathCause);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-zinc-100/90 to-white p-8 text-center shadow-sm dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950 sm:p-10">
        <div className="relative mx-auto w-fit">
          <span
            className="pointer-events-none absolute -right-2 -top-3 z-10 text-4xl drop-shadow-sm sm:text-5xl"
            aria-hidden
          >
            🪦
          </span>
          <span
            className="pointer-events-none absolute -bottom-1 -left-2 z-10 text-2xl opacity-90 sm:text-3xl"
            aria-hidden
          >
            ⚰️
          </span>
          <div className="rounded-2xl p-1 ring-2 ring-zinc-300/80 dark:ring-zinc-600">
            <div className="overflow-hidden rounded-[0.875rem] opacity-[0.92] saturate-[0.88]">
              <CharacterAvatar
                look={state.avatar}
                avatarNice={state.avatarNice}
                age={state.age}
                size={state.avatarNice ? 128 : 118}
              />
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400">
          Game over
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          You died
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/90">
          This life has ended. Everything below is what you leave behind. When
          you are ready, you can start a brand-new run.
        </p>
        {causeLine ? (
          <p className="mx-auto mt-3 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
            {causeLine}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          In short
        </h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {name}
          </span>{" "}
          lived to age{" "}
          <span className="tabular-nums font-semibold">{state.age}</span>.{" "}
          {ls.tier}
        </p>
        <p className="mt-4 border-l-2 border-rose-300/80 pl-4 text-sm font-medium text-rose-950 dark:border-rose-600/60 dark:text-rose-100">
          {epitaphTitle}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {epitaphBody}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Final vitals
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Health 0
          </span>
          . The rest of who you were — mind, mood, relationships, money, and
          build — is folded into your legacy and life-success score, not shown
          as day-to-day bars anymore.
        </p>
      </div>

      <LegacyTrackingPanel
        className="mt-0"
        legacyFamilyHarmony={state.legacyFamilyHarmony}
        legacyRepute={state.legacyRepute}
        legacyGenerosity={state.legacyGenerosity}
        legacyHeirReadiness={state.legacyHeirReadiness}
        lifetimeDonatedTotal={state.lifetimeDonatedTotal}
      />

      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
          Your world
        </h2>
        <p className="mt-2 text-xs text-emerald-900/80 dark:text-emerald-100/80">
          Born in{" "}
          <span className="font-semibold text-emerald-950 dark:text-emerald-50">
            {countryDisplayName(state.homeCountryId)}
          </span>
          .
          {(state.residenceCountryId !== state.homeCountryId ||
            state.residenceCountryId === RESIDENCE_NOMAD_ID) && (
            <>
              {" "}
              Late-life base:{" "}
              <span className="font-semibold text-emerald-950 dark:text-emerald-50">
                {residenceDisplayLabel(state.residenceCountryId)}
              </span>
              .
            </>
          )}
        </p>
        <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          Countries visited
        </h3>
        {state.countriesVisited.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No stamps this run — the story never left home, or trips weren&apos;t
            logged.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {[...state.countriesVisited].sort().map((cid) => (
              <li
                key={cid}
                className="rounded-lg border border-emerald-300/70 bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-950 dark:border-emerald-800/50 dark:bg-zinc-900/70 dark:text-emerald-100"
              >
                {countryDisplayName(cid)}
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          Languages
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-800 dark:text-zinc-200">
          {Object.entries(state.languageLevels)
            .sort(([a], [b]) =>
              languageDisplayName(a).localeCompare(languageDisplayName(b)),
            )
            .map(([code, lvl]) => (
              <li key={code}>
                <span className="font-semibold">
                  {languageDisplayName(code)}
                </span>
                <span className="text-zinc-500"> — {levelWord(lvl)}</span>
              </li>
            ))}
        </ul>
      </div>

      <LifeReviewCard state={state} />

      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/40 p-5 dark:border-violet-900/40 dark:bg-violet-950/25">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
          Achievements ({state.achievementIds.length}/{ACHIEVEMENTS.length})
        </h2>
        {state.achievementIds.length === 0 ? (
          <p className="mt-3 text-sm text-violet-900/70 dark:text-violet-200/70">
            None this run — try another path.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.achievementIds.map((id) => {
              const meta = getAchievementMeta(id);
              return (
                <li
                  key={id}
                  className="rounded-lg border border-violet-200/60 bg-white/70 px-3 py-2 text-left text-xs dark:border-violet-800/50 dark:bg-zinc-900/50"
                >
                  <span className="font-semibold text-violet-900 dark:text-violet-100">
                    {meta.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
                    {meta.description}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-zinc-200/80 pt-8 dark:border-zinc-800">
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={saving}
          className="w-full max-w-sm rounded-full bg-rose-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-500 disabled:opacity-50 sm:w-auto"
        >
          Start a new life
        </button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          This clears your save and opens character setup again.
        </p>
      </div>
    </div>
  );
}
