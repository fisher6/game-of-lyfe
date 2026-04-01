"use client";

function LegacyBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "amber" | "emerald" | "violet" | "cyan";
}) {
  const pct = Math.round((value / max) * 100);
  const bg =
    tone === "amber"
      ? "bg-amber-500"
      : tone === "violet"
        ? "bg-violet-500"
        : tone === "cyan"
          ? "bg-cyan-500"
          : "bg-emerald-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        <span className="min-w-0 leading-snug">{label}</span>
        <span className="shrink-0 tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export type LegacyTrackingPanelProps = {
  legacyFamilyHarmony: number;
  legacyRepute: number;
  legacyGenerosity: number;
  legacyHeirReadiness: number;
  lifetimeDonatedTotal: number;
  /** Extra top margin when embedded under other vitals (StatBars uses mt-4). */
  className?: string;
};

/**
 * Late-life legacy vitals — shown from age 65+ while living, always on the death summary.
 */
export function LegacyTrackingPanel({
  legacyFamilyHarmony,
  legacyRepute,
  legacyGenerosity,
  legacyHeirReadiness,
  lifetimeDonatedTotal,
  className = "mt-4",
}: LegacyTrackingPanelProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/25 ${className}`}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200/90">
        Legacy
      </p>
      <p className="mb-3 text-[11px] font-medium leading-snug text-amber-950/90 dark:text-amber-100/85">
        We now can track your legacy!
      </p>
      <div className="grid grid-cols-1 gap-3">
        <LegacyBar
          label="Family harmony"
          value={legacyFamilyHarmony}
          max={100}
          tone="amber"
        />
        <LegacyBar label="Repute" value={legacyRepute} max={100} tone="violet" />
        <LegacyBar
          label="Generosity"
          value={legacyGenerosity}
          max={100}
          tone="emerald"
        />
        <LegacyBar
          label="Heir readiness"
          value={legacyHeirReadiness}
          max={100}
          tone="cyan"
        />
      </div>
      {lifetimeDonatedTotal > 0 ? (
        <p className="mt-3 text-xs tabular-nums text-amber-900/80 dark:text-amber-100/70">
          Lifetime gifts tracked: $
          {lifetimeDonatedTotal.toLocaleString("en-US")}
        </p>
      ) : null}
    </div>
  );
}
