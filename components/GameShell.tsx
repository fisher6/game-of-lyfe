"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { StatBars } from "@/components/StatBars";
import { DeathMemorialView } from "@/components/DeathMemorialView";
import { LifeReviewCard } from "@/components/LifeReviewCard";
import type { CharacterSetupPayload, GameState } from "@/lib/game/types";
import { StatFloatEffects } from "@/components/StatFloatEffects";
import { AchievementCelebration } from "@/components/AchievementCelebration";
import { CharacterSetupPanel } from "@/components/CharacterSetupPanel";
import { getAchievementMeta } from "@/lib/game/achievements";
import {
  adminSkipYears,
  applyChoiceWithPreview,
  completeCharacterSetup,
  createInitialState,
  DEATH_NODE_ID,
  diffStatSnapshot,
  type StatDiffSummary,
  getVisibleChoices,
  getVisibleNode,
  isAtTerminal,
  LIFE_EPILOGUE_NODE_ID,
} from "@/lib/game/engine";
import { resetGame, saveGame } from "@/app/play/actions";

type GameShellProps = {
  initialState: GameState;
};

/** Dev server always shows “Skip ~10 yrs”. Deployed builds need `NEXT_PUBLIC_GAME_ADMIN_TOOLS=1`. */
const showAdminTools =
  process.env.NEXT_PUBLIC_GAME_ADMIN_TOOLS === "1" ||
  process.env.NODE_ENV === "development";

export function GameShell({ initialState }: GameShellProps) {
  const [state, setState] = useState<GameState>(initialState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statFx, setStatFx] = useState<StatDiffSummary | null>(null);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [setupExiting, setSetupExiting] = useState(false);
  const [mainAnimatingIn, setMainAnimatingIn] = useState(false);
  const [achievementSplash, setAchievementSplash] = useState<{
    message: string;
    key: number;
  } | null>(null);
  const skipSaveRef = useRef(true);
  const achievementBootRef = useRef(true);
  const prevAchievementLenRef = useRef(0);

  const node = getVisibleNode(state);
  const terminal = isAtTerminal(state);
  const visibleChoices =
    node && !terminal ? getVisibleChoices(state, node) : [];
  const isDeathScreen =
    state.gamePhase === "dead" || state.currentNodeId === DEATH_NODE_ID;

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      setSaving(true);
      setSaveError(null);
      void saveGame(state)
        .catch(() => setSaveError("Could not save. Check your connection."))
        .finally(() => setSaving(false));
    }, 500);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (achievementBootRef.current) {
      achievementBootRef.current = false;
      prevAchievementLenRef.current = state.achievementIds.length;
      return;
    }
    const prev = prevAchievementLenRef.current;
    const now = state.achievementIds.length;
    prevAchievementLenRef.current = now;
    if (now > prev) {
      const added = state.achievementIds.slice(prev);
      const titles = added.map((id) => getAchievementMeta(id).title);
      setAchievementSplash({
        message: titles.join(" · "),
        key: Date.now(),
      });
      const t = window.setTimeout(() => setAchievementSplash(null), 5600);
      return () => window.clearTimeout(t);
    }
  }, [state.achievementIds]);

  const onChoose = useCallback((index: number) => {
    setState((s) => {
      const { next, diff } = applyChoiceWithPreview(s, index);
      queueMicrotask(() => setStatFx(diff));
      return next;
    });
  }, []);

  const onAdminSkip10 = useCallback(() => {
    setState((s) => {
      const before = s;
      const next = adminSkipYears(s, 10);
      queueMicrotask(() => setStatFx(diffStatSnapshot(before, next)));
      return next;
    });
  }, []);

  const performRestart = useCallback(() => {
    void (async () => {
      try {
        await resetGame();
        setStatFx(null);
        setRestartConfirmOpen(false);
        setSetupExiting(false);
        setMainAnimatingIn(false);
        setState(createInitialState());
      } catch {
        setSaveError("Could not reset.");
      }
    })();
  }, []);

  const handleCompleteSetup = useCallback(
    (name: string, payload: CharacterSetupPayload) => {
      if (saving) return;
      setSetupExiting(true);
      window.setTimeout(() => {
        setState((s) =>
          completeCharacterSetup(s, {
            characterName: name,
            avatar: payload.avatar,
            avatarNice: payload.avatarNice,
            homeCountryId: payload.homeCountryId,
          }),
        );
        setSetupExiting(false);
        setMainAnimatingIn(true);
        window.setTimeout(() => setMainAnimatingIn(false), 480);
      }, 300);
    },
    [saving],
  );

  useEffect(() => {
    if (!restartConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRestartConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restartConfirmOpen]);

  const restartModal =
    restartConfirmOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="presentation"
        onClick={() => setRestartConfirmOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-confirm-title"
          className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="restart-confirm-title"
            className="text-center text-base font-semibold leading-snug text-red-600 dark:text-red-400"
          >
            Are you sure? Your whole progress will be deleted.
          </h2>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setRestartConfirmOpen(false)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={performRestart}
              disabled={saving}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              Restart game
            </button>
          </div>
        </div>
      </div>
    ) : null;

  if (!node) {
    return (
      <>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Something went wrong.</p>
          <button
            type="button"
            onClick={() => setRestartConfirmOpen(true)}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Start over
          </button>
        </div>
        {restartModal}
      </>
    );
  }

  if (node.id === "character_setup") {
    return (
      <>
        <div
          className={`mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-10 transition-opacity duration-300 ease-out sm:max-w-xl sm:py-14 ${
            setupExiting ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <AppLogo size={40} title="" />
              <span className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                Game of Lyfe
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                signOut({ callbackUrl: "/" })
              }
              className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
            >
              Sign out
            </button>
          </div>
          {node.title ? (
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              {node.title}
            </h1>
          ) : null}
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {node.body}
          </p>
          <CharacterSetupPanel
            standalone
            disabled={saving}
            onBegin={handleCompleteSetup}
          />
        </div>
        {restartModal}
      </>
    );
  }

  return (
    <div
      className={`mx-auto flex min-h-0 flex-1 flex-col px-4 py-6 sm:max-w-4xl sm:py-10 ${
        mainAnimatingIn ? "animate-game-main-in" : ""
      }`}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl py-1 pr-2 text-zinc-700 transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:hover:text-white"
          >
            <AppLogo size={36} title="" />
            <span className="text-sm font-semibold tracking-tight">
              Game of Lyfe
            </span>
          </Link>
          {saving && (
            <span className="text-xs text-zinc-400">Saving…</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showAdminTools && !terminal && state.gamePhase === "living" ? (
            <button
              type="button"
              title="Demo only: auto-pick random choices until about 10 more years pass"
              onClick={() => {
                if (saving) return;
                onAdminSkip10();
              }}
              disabled={saving}
              className="rounded-full border border-amber-500/80 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600/80 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/60"
            >
              Skip ~10 yrs
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setRestartConfirmOpen(true)}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-600"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={() =>
              signOut({ callbackUrl: "/" })
            }
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-600"
          >
            Sign out
          </button>
        </div>
      </header>

      {isDeathScreen ? (
        <>
          <DeathMemorialView
            state={state}
            epitaphTitle={node.title ?? ""}
            epitaphBody={node.body ?? ""}
            onPlayAgain={() => setRestartConfirmOpen(true)}
            saving={saving}
          />
          {saveError && (
            <p className="mt-4 text-center text-sm text-rose-600 dark:text-rose-400">
              {saveError}
            </p>
          )}
        </>
      ) : (
        <>
          <StatBars
            characterName={state.characterName}
            avatar={state.avatar}
            avatarNice={state.avatarNice}
            health={state.health}
            happiness={state.happiness}
            intelligence={state.intelligence}
            socialSkill={state.socialSkill}
            romanticSkill={state.romanticSkill}
            assets={state.assets}
            debt={state.debt}
            homeValue={state.homeValue}
            homeLabel={state.homeLabel}
            age={state.age}
            northStar={state.northStar}
            lifeLog={state.lifeLog}
            achievementIds={state.achievementIds}
            legacyFamilyHarmony={state.legacyFamilyHarmony}
            legacyRepute={state.legacyRepute}
            legacyGenerosity={state.legacyGenerosity}
            legacyHeirReadiness={state.legacyHeirReadiness}
            lifetimeDonatedTotal={state.lifetimeDonatedTotal}
            heightInches={state.heightInches}
            weightLbs={state.weightLbs}
            homeCountryId={state.homeCountryId}
            residenceCountryId={state.residenceCountryId}
            countriesVisited={state.countriesVisited}
            languageLevels={state.languageLevels}
            choicePanel={<StatFloatEffects diff={statFx} />}
          />

          {saveError && (
            <p className="mt-4 text-center text-sm text-rose-600 dark:text-rose-400">
              {saveError}
            </p>
          )}

          <article className="mt-8 flex w-full min-w-0 flex-1 flex-col rounded-3xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:p-8">
            {node.title && (
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {node.title}
              </h1>
            )}
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {node.body}
            </p>

            {terminal ? (
              <div className="mt-10 flex flex-col gap-4">
                {state.currentNodeId === LIFE_EPILOGUE_NODE_ID && (
                  <LifeReviewCard state={state} />
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRestartConfirmOpen(true)}
                    disabled={saving}
                    className="rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    Play again
                  </button>
                </div>
              </div>
            ) : (
              <ul className="mt-10 flex flex-col gap-3">
                {visibleChoices.map(({ choice: c, index: i }) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onChoose(i)}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left text-sm font-medium text-zinc-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-violet-600 dark:hover:bg-violet-950/40 disabled:opacity-50"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
      {achievementSplash ? (
        <AchievementCelebration
          key={achievementSplash.key}
          splashKey={achievementSplash.key}
          message={achievementSplash.message}
        />
      ) : null}
      {restartModal}
    </div>
  );
}
