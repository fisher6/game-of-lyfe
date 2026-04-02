"use client";

import {
  useMemo,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useLocale } from "@/lib/i18n/context";

const HERO_EMOJI = ["🏆", "🎉", "✨", "⭐", "🎊", "💫", "🔥"] as const;
const FLOAT_EMOJI = ["✨", "⭐", "·", "✦", "＊"] as const;

type AchievementCelebrationProps = {
  /** Changes on each unlock to re-run entrance + confetti. */
  splashKey: number;
  /** Achievement titles joined for screen readers / subtitle. */
  message: string;
};

/** Deterministic pseudo-random 0..1 from integer seed */
function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function AchievementCelebration({
  splashKey,
  message,
}: AchievementCelebrationProps) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const hero = useMemo(() => {
    const r = mulberry32(splashKey || 1);
    return HERO_EMOJI[Math.floor(r() * HERO_EMOJI.length)]!;
  }, [splashKey]);

  const confetti = useMemo(() => {
    const r = mulberry32(splashKey ^ 0x9e3779b9);
    return Array.from({ length: 36 }, (_, i) => {
      const left = `${(i * 97 + r() * 18) % 100}%`;
      const delay = `${r() * 0.35}s`;
      const duration = `${0.95 + r() * 1.15}s`;
      const drift = `${(r() - 0.5) * 120}px`;
      const rot = `${r() * 1080}deg`;
      const hue = Math.floor(r() * 360);
      const w = 6 + Math.floor(r() * 7);
      const h = 8 + Math.floor(r() * 9);
      const rounded = r() > 0.45;
      return { left, delay, duration, drift, rot, hue, w, h, rounded, i };
    });
  }, [splashKey]);

  const floats = useMemo(() => {
    const r = mulberry32((splashKey << 1) ^ 0x85ebca6b);
    return Array.from({ length: 14 }, (_, i) => ({
      sym: FLOAT_EMOJI[i % FLOAT_EMOJI.length]!,
      left: `${8 + r() * 84}%`,
      delay: `${r() * 0.5}s`,
      dur: `${2.2 + r() * 1.4}s`,
      i,
    }));
  }, [splashKey]);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">
        {t("splash.srOnly")}
        {message}
      </span>

      {confetti.map((c) => (
        <span
          key={`c-${splashKey}-${c.i}`}
          className="achievement-confetti-piece"
          style={
            {
              left: c.left,
              animationDelay: c.delay,
              animationDuration: c.duration,
              width: c.w,
              height: c.h,
              borderRadius: c.rounded ? "999px" : "2px",
              backgroundColor: `hsl(${c.hue} 82% 58%)`,
              boxShadow: `0 0 6px hsl(${c.hue} 90% 45% / 0.5)`,
              "--ach-drift": c.drift,
              "--ach-rot": c.rot,
            } as CSSProperties
          }
        />
      ))}

      {floats.map((f) => (
        <span
          key={`f-${splashKey}-${f.i}`}
          className="achievement-float-emoji"
          style={{
            left: f.left,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        >
          {f.sym}
        </span>
      ))}

      <div className="relative z-[2] flex justify-center pt-6 sm:pt-10">
        <div className="achievement-banner max-w-lg px-4 text-center">
          <div
            className="achievement-banner-inner mx-auto rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-violet-50 px-5 py-4 shadow-[0_20px_50px_-12px_rgba(124,58,237,0.35)] dark:border-amber-500/40 dark:from-amber-950/90 dark:via-zinc-900 dark:to-violet-950/80 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="achievement-hero-emoji text-4xl sm:text-5xl">
              {hero}
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              {t("splash.title")}
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-lg">
              {message}
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t("splash.keepGoing")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
