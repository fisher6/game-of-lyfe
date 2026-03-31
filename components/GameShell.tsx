"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { StatBars } from "@/components/StatBars";
import type { GameState } from "@/lib/game/types";
import {
  applyChoice,
  createInitialState,
  getVisibleNode,
  isAtTerminal,
} from "@/lib/game/engine";
import { resetGame, saveGame } from "@/app/play/actions";

type GameShellProps = {
  initialState: GameState;
};

export function GameShell({ initialState }: GameShellProps) {
  const [state, setState] = useState<GameState>(initialState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const skipSaveRef = useRef(true);

  const node = getVisibleNode(state);
  const terminal = isAtTerminal(state);

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

  const onChoose = useCallback((index: number) => {
    setState((s) => applyChoice(s, index));
  }, []);

  const onRestart = useCallback(() => {
    void (async () => {
      try {
        await resetGame();
        setState(createInitialState());
      } catch {
        setSaveError("Could not reset.");
      }
    })();
  }, []);

  if (!node) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Something went wrong.</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 flex-1 flex-col px-4 py-6 sm:max-w-2xl sm:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
          >
            Home
          </Link>
          {saving && (
            <span className="text-xs text-zinc-400">Saving…</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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

      <StatBars
        health={state.health}
        happiness={state.happiness}
        money={state.money}
        age={state.age}
      />

      {saveError && (
        <p className="mt-4 text-center text-sm text-rose-600 dark:text-rose-400">
          {saveError}
        </p>
      )}

      <article className="mt-8 flex flex-1 flex-col rounded-3xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:p-8">
        {node.title && (
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {node.title}
          </h1>
        )}
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {node.body}
        </p>

        {terminal ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRestart}
              disabled={saving}
              className="rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50"
            >
              Play again
            </button>
          </div>
        ) : (
          <ul className="mt-10 flex flex-col gap-3">
            {node.choices.map((c, i) => (
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
    </div>
  );
}
