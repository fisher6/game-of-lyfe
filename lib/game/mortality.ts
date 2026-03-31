import type { GameState } from "@/lib/game/types";
import { RESIDENCE_NOMAD_ID } from "@/lib/game/world";

/**
 * Sex-blended period mortality ~high-income Western / OECD (roughly US–WEU 2018–2021).
 * q_x = probability of dying within the year after turning age x.
 */
const AGE_DEATH_Q: [number, number][] = [
  [18, 0.00062],
  [20, 0.00074],
  [25, 0.00092],
  [30, 0.00118],
  [35, 0.00152],
  [40, 0.00205],
  [45, 0.00305],
  [50, 0.00465],
  [55, 0.00725],
  [60, 0.0112],
  [65, 0.017],
  [70, 0.0265],
  [75, 0.042],
  [80, 0.0665],
  [85, 0.112],
  [90, 0.182],
  [95, 0.285],
  [100, 0.4],
];

function interpolateAnnualQ(age: number): number {
  const a = Math.max(18, Math.min(105, age));
  if (a >= AGE_DEATH_Q[AGE_DEATH_Q.length - 1]![0]) {
    return AGE_DEATH_Q[AGE_DEATH_Q.length - 1]![1];
  }
  for (let i = 0; i < AGE_DEATH_Q.length - 1; i++) {
    const [x0, q0] = AGE_DEATH_Q[i]!;
    const [x1, q1] = AGE_DEATH_Q[i + 1]!;
    if (a <= x1) {
      const t = (a - x0) / (x1 - x0);
      return q0 + t * (q1 - q0);
    }
  }
  return AGE_DEATH_Q[AGE_DEATH_Q.length - 1]![1];
}

/** Where the baseline OECD-style table fits best (character “living in the developed West”). */
const WESTERN_LONGEVITY_BASELINE = new Set([
  "us",
  "ca",
  "gb",
  "ie",
  "fr",
  "de",
  "es",
  "it",
  "pt",
  "nl",
  "se",
  "no",
  "gr",
  "au",
  "nz",
  "il",
  "jp",
  "kr",
]);

/** Developed / mid-income — modestly higher annual risk than core OECD. */
const MODERATE_LONGEVITY_GAP = new Set([
  "pl",
  "mx",
  "jm",
  "bs",
  "br",
  "ar",
  "tr",
  "ru",
  "za",
  "cn",
  "in",
  "ph",
  "ng",
  "eg",
]);

function countryId(residenceCountryId: string, homeCountryId: string): string {
  const raw =
    residenceCountryId === RESIDENCE_NOMAD_ID
      ? homeCountryId
      : residenceCountryId;
  return raw.trim().toLowerCase().slice(0, 8);
}

/** Multiplier on baseline q from residence (or birth country if nomad). */
export function mortalityRegionMultiplier(
  residenceCountryId: string,
  homeCountryId: string,
): number {
  const id = countryId(residenceCountryId, homeCountryId);
  if (WESTERN_LONGEVITY_BASELINE.has(id)) return 1;
  if (MODERATE_LONGEVITY_GAP.has(id)) return 1.14;
  return 1.32;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** In-game health bar + flags nudge chance without replacing the life table. */
export function mortalityLifestyleMultiplier(
  healthStat: number,
  flags: string[],
  bmi: number,
): number {
  let m = 1;
  const h = clamp(healthStat, 0, 100);
  m *= clamp(1.12 - 0.004 * (h - 58), 0.42, 1.28);

  if (flags.some((f) => /smoking|heavy_drinker|spent_on_vice/.test(f)))
    m *= 1.14;
  if (flags.some((f) => /fast_food_phase|fast_food|sedentary_phase|sedentary/.test(f)))
    m *= 1.08;
  if (flags.includes("athlete_track")) m *= 0.94;
  if (bmi >= 35) m *= 1.12;
  else if (bmi >= 32) m *= 1.07;
  else if (bmi < 17) m *= 1.06;

  return clamp(m, 0.34, 1.9);
}

export type AnnualMortalityParts = {
  ageCompleted: number;
  residenceCountryId: string;
  homeCountryId: string;
  healthStat: number;
  flags: string[];
  bmi: number;
};

/** Annual probability of death after completing this birthday year (age = y). */
export function annualDeathProbability(parts: AnnualMortalityParts): number {
  const { ageCompleted: age } = parts;
  if (age < 18) return 0;

  const q0 = interpolateAnnualQ(age);
  const region = mortalityRegionMultiplier(
    parts.residenceCountryId,
    parts.homeCountryId,
  );
  const life = mortalityLifestyleMultiplier(
    parts.healthStat,
    parts.flags,
    parts.bmi,
  );
  return clamp(q0 * region * life, 0, 0.52);
}

/** Convenience from full state after other birthday updates this iteration. */
export function annualDeathProbabilityFromState(
  state: GameState,
  ageCompleted: number,
  bmi: number,
): number {
  return annualDeathProbability({
    ageCompleted,
    residenceCountryId: state.residenceCountryId,
    homeCountryId: state.homeCountryId,
    healthStat: state.health,
    flags: state.flags,
    bmi,
  });
}
