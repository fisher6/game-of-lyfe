"use client";

type StatBarsProps = {
  health: number;
  happiness: number;
  intelligence: number;
  money: number;
  age: number;
};

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "rose" | "amber" | "emerald" | "violet";
}) {
  const pct = Math.round((value / max) * 100);
  const bg =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "violet"
          ? "bg-violet-500"
          : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatBars({
  health,
  happiness,
  intelligence,
  money,
  age,
}: StatBarsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Vitals
        </p>
        <div className="space-y-4">
          <Bar label="Health" value={health} max={100} tone="emerald" />
          <Bar label="Happiness" value={happiness} max={100} tone="amber" />
          <Bar
            label="Intelligence"
            value={intelligence}
            max={100}
            tone="violet"
          />
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Life
        </p>
        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="text-xs text-zinc-500">Age</p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {age}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Money</p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              ${money.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
