"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { LegacyTrackingPanel } from "@/components/LegacyTrackingPanel";
import { LifeReviewCard } from "@/components/LifeReviewCard";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import type { GameState, LanguageLevel } from "@/lib/game/types";
import { computeLifeSuccessScore } from "@/lib/game/engine";
import { useLocale } from "@/lib/i18n/context";
import {
  RESIDENCE_NOMAD_ID,
  countryDisplayName,
  languageDisplayName,
  residenceDisplayLabel,
} from "@/lib/game/world";

type DeathMemorialViewProps = {
  state: GameState;
  /** From the death node — shown as the narrative beat */
  epitaphTitle: string;
  epitaphBody: string;
  onPlayAgain: () => void;
  saving: boolean;
};

function deathCauseLabel(
  cause: string | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  if (!cause || !cause.trim()) return null;
  const c = cause.trim().toLowerCase();
  if (c === "health") return t("death.cause.health");
  if (c === "natural") return t("death.cause.natural");
  if (c === "killed_in_service") return t("death.cause.service");
  return t("death.cause.other", { cause: cause.slice(0, 120) });
}

export function DeathMemorialView({
  state,
  epitaphTitle,
  epitaphBody,
  onPlayAgain,
  saving,
}: DeathMemorialViewProps) {
  const { t, achievement, locale } = useLocale();
  const name = state.characterName.trim() || t("death.you");
  const ls = computeLifeSuccessScore(state);
  const causeLine = deathCauseLabel(state.deathCause, t);

  function levelWord(l: LanguageLevel): string {
    if (l === "native") return t("level.native");
    if (l === "proficient") return t("level.proficient");
    if (l === "knowledgeable") return t("level.knowledgeable");
    return t("level.basic");
  }

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
          {t("death.gameOver")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {t("death.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/90">
          {t("death.intro")}
        </p>
        {causeLine ? (
          <p className="mx-auto mt-3 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
            {causeLine}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t("death.inShort")}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          {t("death.summary", { name, age: state.age })}{" "}
          {t(`tier.${ls.tierKey}`)}
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
          {t("death.finalVitals")}
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {t("death.finalVitalsBody")}
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
          {t("death.yourWorld")}
        </h2>
        <p className="mt-2 text-xs text-emerald-900/80 dark:text-emerald-100/80">
          {t("death.bornIn", {
            country: countryDisplayName(state.homeCountryId, locale),
          })}
          {(state.residenceCountryId !== state.homeCountryId ||
            state.residenceCountryId === RESIDENCE_NOMAD_ID) && (
            <>
              {" "}
              {t("death.lateLife", {
                place: residenceDisplayLabel(state.residenceCountryId, locale),
              })}
            </>
          )}
        </p>
        <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          {t("death.visited")}
        </h3>
        {state.countriesVisited.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("death.visitedEmpty")}
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {[...state.countriesVisited].sort().map((cid) => (
              <li
                key={cid}
                className="rounded-lg border border-emerald-300/70 bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-950 dark:border-emerald-800/50 dark:bg-zinc-900/70 dark:text-emerald-100"
              >
                {countryDisplayName(cid, locale)}
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          {t("death.langs")}
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-800 dark:text-zinc-200">
          {Object.entries(state.languageLevels)
            .sort(([a], [b]) =>
              languageDisplayName(a, locale).localeCompare(
                languageDisplayName(b, locale),
                locale === "he" ? "he" : "en",
              ),
            )
            .map(([code, lvl]) => (
              <li key={code}>
                <span className="font-semibold">
                  {languageDisplayName(code, locale)}
                </span>
                <span className="text-zinc-500">
                  {t("death.langSep")}
                  {levelWord(lvl)}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <LifeReviewCard state={state} />

      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/40 p-5 dark:border-violet-900/40 dark:bg-violet-950/25">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
          {t("death.achievementsFull", {
            a: state.achievementIds.length,
            b: ACHIEVEMENTS.length,
          })}
        </h2>
        {state.achievementIds.length === 0 ? (
          <p className="mt-3 text-sm text-violet-900/70 dark:text-violet-200/70">
            {t("death.achEmpty")}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.achievementIds.map((id) => {
              const meta = achievement(id);
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
          {t("death.playAgain")}
        </button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t("death.playAgainHint")}
        </p>
      </div>
    </div>
  );
}
