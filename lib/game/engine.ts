import {
  CONTENT_VERSION,
  type AvatarLook,
  type Choice,
  type GameState,
  type LanguageLevel,
  type LifeLogEntry,
  type LifeNode,
  type StatDelta,
  type StoredNiceAvatarConfig,
} from "./types";
import { normalizeNiceAvatar } from "./avatar-nice";
import { unlockAchievements } from "./achievements";
import { getContent, getNode, getStartNodeId } from "./content";
import {
  countryImmersionLang,
  countryPrimaryLang,
  getCountryDef,
  immersionThresholdBasic,
  immersionThresholdProficient,
  isRegionalConflictProneCountry,
  mergeLanguageLevel,
  RESIDENCE_NOMAD_ID,
} from "./world";
import { annualDeathProbabilityFromState } from "./mortality";
import type { AppLocale } from "@/lib/i18n/types";
import {
  localizeLifeNode,
  localizedChoiceLabel,
  localizedNodeTitleForLog,
  syntheticLifeLogStrings,
} from "./story-localize";

const MIN_STAT = 0;
const MAX_STAT = 100;
/** Below this age: no debt, assets floored at 0 (first loans at college / 18+). */
const MINOR_MAX_AGE = 17;

export const DEATH_NODE_ID = "death_natural";
export const LIFE_EPILOGUE_NODE_ID = "life_epilogue";

const DEFAULT_LEGACY = 50;

export type EstateSummary = {
  estateGross: number;
  netLiquid: number;
  heirShare: number;
  charityShare: number;
  charityFraction: number;
  homeValue: number;
};

/** Estate at end of life: liquid net + home; split using will flags from content. */
export function computeEstateSummary(state: GameState): EstateSummary {
  const netLiquid = Math.max(0, state.assets - state.debt);
  const home =
    typeof state.homeValue === "number" && state.homeValue > 0
      ? state.homeValue
      : 0;
  const estateGross = netLiquid + home;
  let charityFraction = 0.12;
  if (state.flags.includes("estate_charity_focus")) charityFraction = 0.62;
  else if (state.flags.includes("estate_balanced_will")) charityFraction = 0.35;
  else if (state.flags.includes("estate_family_first")) charityFraction = 0.08;
  const charityShare = Math.round(estateGross * charityFraction);
  const heirShare = Math.max(0, estateGross - charityShare);
  return {
    estateGross,
    netLiquid,
    heirShare,
    charityShare,
    charityFraction,
    homeValue: home,
  };
}

const ADMIN_SKIP_MAX_STEPS = 140;

/**
 * Demo/admin: randomly pick among visible choices until in-game age rises by
 * `yearBudget`, the run ends, or a step cap is hit. Not deterministic.
 */
export function adminSkipYears(
  state: GameState,
  yearBudget: number,
  locale: AppLocale = "en",
): GameState {
  if (yearBudget <= 0) return unlockAchievements(state);
  if (state.gamePhase === "dead") return state;
  const targetAge = state.age + yearBudget;
  let s = state;
  for (let step = 0; step < ADMIN_SKIP_MAX_STEPS; step++) {
    if (s.age >= targetAge) break;
    if (s.gamePhase === "dead") break;
    const n = getNode(s.currentNodeId);
    if (!n || n.id === "character_setup") break;
    if (isAtTerminal(s)) break;
    const visible = getVisibleChoices(s, n);
    if (visible.length === 0) break;
    const pick = visible[Math.floor(Math.random() * visible.length)]!;
    s = applyChoice(s, pick.index, locale);
  }
  return unlockAchievements(s);
}

export type LifeSuccessBreakdown = {
  happiness: number;
  health: number;
  legacy: number;
  wealth: number;
  generosity: number;
  familyAndLongevity: number;
};

/** Tier band for life-success score — localize in UI via i18n. */
export type LifeSuccessTierKey =
  | "extraordinary"
  | "remarkable"
  | "solid"
  | "mixed"
  | "hard"
  | "complicated";

export type LifeSuccessResult = {
  score: number;
  tierKey: LifeSuccessTierKey;
  breakdown: LifeSuccessBreakdown;
};

/** Structured family / relationship summary — localize labels in UI. */
export type FamilySummaryLine =
  | { type: "partner" }
  | { type: "kids"; count: number }
  | { type: "kids_vague" }
  | { type: "grandkids"; count: number }
  | { type: "no_kids_path" }
  | { type: "caregiving_parent" }
  | { type: "estranged" }
  | { type: "family_focus" }
  | { type: "empty" };

export function getFamilySummaryLines(state: GameState): FamilySummaryLine[] {
  const lines: FamilySummaryLine[] = [];
  if (state.flags.includes("has_partner")) {
    lines.push({ type: "partner" });
  }
  if (state.kidsCount > 0) {
    lines.push({ type: "kids", count: state.kidsCount });
  } else if (state.flags.includes("has_kids")) {
    lines.push({ type: "kids_vague" });
  }
  if (state.grandkidsCount > 0) {
    lines.push({ type: "grandkids", count: state.grandkidsCount });
  }
  if (state.flags.includes("no_kids") && state.kidsCount === 0) {
    lines.push({ type: "no_kids_path" });
  }
  if (state.flags.includes("caregiving_parent")) {
    lines.push({ type: "caregiving_parent" });
  }
  if (state.flags.includes("estranged_family")) {
    lines.push({ type: "estranged" });
  }
  if (state.flags.includes("family_focus")) {
    lines.push({ type: "family_focus" });
  }
  if (lines.length === 0) {
    lines.push({ type: "empty" });
  }
  return lines;
}

/**
 * Single 0–100 “how well did this life land?” Score weights happiness heavily;
 * blends legacy vitals, wealth, giving, relationships, and lifespan.
 */
export function computeLifeSuccessScore(state: GameState): LifeSuccessResult {
  const es = computeEstateSummary(state);
  const happiness = clamp(state.happiness, MIN_STAT, MAX_STAT);
  const health = clamp(state.health, MIN_STAT, MAX_STAT);
  const legacy = clamp(
    (state.legacyFamilyHarmony +
      state.legacyRepute +
      state.legacyGenerosity +
      state.legacyHeirReadiness) /
      4,
    MIN_STAT,
    MAX_STAT,
  );
  const wealth = clamp(
    100 * (1 - Math.exp(-es.estateGross / 350_000)),
    MIN_STAT,
    MAX_STAT,
  );
  const genFromMoney = clamp(
    100 * (1 - Math.exp(-state.lifetimeDonatedTotal / 85_000)),
    MIN_STAT,
    MAX_STAT,
  );
  const generosity = clamp((genFromMoney + state.legacyGenerosity) / 2, 0, 100);

  let family = 40;
  if (state.flags.includes("has_partner")) family += 20;
  if (state.flags.includes("has_kids")) family += 20;
  if (state.flags.includes("estranged_family")) family -= 20;
  if (state.flags.includes("caregiving_parent")) family += 10;
  family = clamp(family, MIN_STAT, MAX_STAT);

  const longevity = clamp(((state.age - 24) / 72) * 100, 0, 100);
  const familyAndLongevity = clamp(family * 0.62 + longevity * 0.38, 0, 100);
  const phyEdge = clamp(
    50 + (physiqueLifeEdgePercent(state) - 100) * 2.8,
    0,
    100,
  );

  const score = clamp(
    Math.round(
      happiness * 0.3 +
        health * 0.09 +
        legacy * 0.2 +
        wealth * 0.09 +
        generosity * 0.14 +
        familyAndLongevity * 0.12 +
        phyEdge * 0.06,
    ),
    0,
    100,
  );

  let tierKey: LifeSuccessTierKey = "complicated";
  if (score >= 86) tierKey = "extraordinary";
  else if (score >= 72) tierKey = "remarkable";
  else if (score >= 58) tierKey = "solid";
  else if (score >= 44) tierKey = "mixed";
  else if (score >= 28) tierKey = "hard";

  return {
    score,
    tierKey,
    breakdown: {
      happiness,
      health,
      legacy,
      wealth,
      generosity,
      familyAndLongevity,
    },
  };
}

function resolveFatalHealth(state: GameState): GameState {
  if (state.gamePhase === "dead") return state;
  if (state.health > 0) return state;
  const deathCause =
    typeof state.deathCause === "string" && state.deathCause.trim().length > 0
      ? state.deathCause.trim().slice(0, 80)
      : "health";
  return unlockAchievements({
    ...state,
    health: 0,
    gamePhase: "dead",
    currentNodeId: DEATH_NODE_ID,
    deathCause,
  });
}

function clampMinorFinances(s: GameState): GameState {
  if (s.age > MINOR_MAX_AGE) return s;
  return {
    ...s,
    assets: Math.max(0, s.assets),
    debt: 0,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const MIN_HEIGHT_IN = 45;
const MAX_HEIGHT_IN = 79;
const MIN_WEIGHT_LB = 40;
const MAX_WEIGHT_LB = 420;
/** Placeholder before setup completes (woman curve @ 8). */
const PLACEHOLDER_ADULT_HEIGHT_IN = 64;
const KID_START_WEIGHT = 58;

type PlayableSex = "man" | "woman";

function physiqueSex(state: GameState): PlayableSex {
  return state.avatarNice?.sex === "man" ? "man" : "woman";
}

function adultHeightBounds(sex: PlayableSex): { lo: number; hi: number } {
  return sex === "man" ? { lo: 60, hi: 74.5 } : { lo: 53, hi: 74 };
}

function roundHeightInches(h: number): number {
  return Math.round(h * 10) / 10;
}

function teenGrowthEased(t: number): number {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
}

function kidBaselineForAdult(adultInches: number, sex: PlayableSex): number {
  const mid = sex === "man" ? 67 : 61;
  return clamp(49 + (adultInches - mid) * 0.42, 46, 54);
}

/** Height in inches at integer age (8–18+), trending toward adult target. */
function heightAtAge(age: number, adultInches: number, sex: PlayableSex): number {
  const { lo, hi } = adultHeightBounds(sex);
  const adult = clamp(adultInches, lo, hi);
  const kidBase = kidBaselineForAdult(adult, sex);
  if (age <= 8) return kidBase;
  if (age >= 18) return adult;
  const stepped = (age - 8) / 10;
  return kidBase + (adult - kidBase) * teenGrowthEased(stepped);
}

function weightFromBmi(bmi: number, heightInches: number): number {
  const h = Math.max(heightInches, 36);
  return (bmi * h * h) / 703;
}

function lifestyleBmiOffset(flags: string[]): number {
  let n = 0;
  if (flags.some((f) => /fast_food_phase|fast_food/.test(f))) n += 0.95;
  if (flags.some((f) => /sedentary_phase|sedentary/.test(f))) n += 0.6;
  if (flags.includes("athlete_track")) n -= 0.7;
  return n;
}

function targetBmiFromHealth(
  health: number,
  physiqueNature: number,
  flags: string[],
): number {
  const h = clamp(health, 15, 100);
  const center = 21.4 + (h - 72) * 0.065;
  const nature = clamp(physiqueNature, -1.5, 1.5);
  const bmi = center + nature * 2.35 + lifestyleBmiOffset(flags);
  return clamp(bmi, 16.2, 33);
}

function inferAdultHeightFromCurrent(state: GameState, currentH: number): number {
  const sex = physiqueSex(state);
  const { lo, hi } = adultHeightBounds(sex);
  if (state.age >= 18) return clamp(roundHeightInches(currentH), lo, hi);
  let low = lo;
  let high = hi;
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2;
    if (heightAtAge(state.age, mid, sex) < currentH) low = mid;
    else high = mid;
  }
  return roundHeightInches((low + high) / 2);
}

function resolveAdultHeightAndNature(
  state: GameState,
  heightInches: number,
): { adultHeightInches: number; physiqueNature: number } {
  const raw = state as unknown as {
    adultHeightInches?: unknown;
    physiqueNature?: unknown;
  };
  const sex = physiqueSex(state);
  const { lo, hi } = adultHeightBounds(sex);
  const hadAdult =
    typeof raw.adultHeightInches === "number" &&
    Number.isFinite(raw.adultHeightInches);
  const adultHeightInches = hadAdult
    ? clamp(roundHeightInches(raw.adultHeightInches as number), lo, hi)
    : inferAdultHeightFromCurrent(state, heightInches);
  const physiqueNature =
    typeof raw.physiqueNature === "number" &&
    Number.isFinite(raw.physiqueNature)
      ? clamp(raw.physiqueNature as number, -1.5, 1.5)
      : 0;
  return { adultHeightInches, physiqueNature };
}

/** Body-mass index from current height/weight. */
export function computeBmi(state: GameState): number {
  const h = Math.max(state.heightInches, 36);
  return (state.weightLbs / (h * h)) * 703;
}

/**
 * ~0.88–1.12 multiplier on **positive** money gains (paychecks, windfalls).
 * Taller, healthier BMI nudges opportunity; obesity chips it away.
 */
export function physiqueAssetMultiplier(state: GameState): number {
  const h = clamp(state.heightInches, 52, 78);
  const ageF =
    state.age < 14 ? 0.45 : state.age < 20 ? 0.75 : state.age < 55 ? 1 : 0.92;
  const heightEdge = ((h - 64) / 250) * ageF;
  const b = computeBmi(state);
  let fatEdge = 0;
  if (b >= 36) fatEdge -= 0.1;
  else if (b >= 32) fatEdge -= 0.07;
  else if (b >= 28) fatEdge -= 0.035;
  else if (b < 17.5) fatEdge -= 0.025;
  return clamp(1 + heightEdge + fatEdge, 0.88, 1.12);
}

/** Display 85–115: “life edge” from build (success / presence). */
export function physiqueLifeEdgePercent(state: GameState): number {
  const m100 = physiqueAssetMultiplier(state) * 100;
  return Math.round(clamp(m100, 88, 112));
}

function roundPhysique(h: number, w: number) {
  return {
    heightInches: Math.round(h * 10) / 10,
    weightLbs: Math.round(w * 10) / 10,
  };
}

/** Reasonable height/weight for saves from before physique existed. */
function estimatePhysiqueForMigration(age: number, flags: string[]) {
  const ath =
    flags.includes("athlete_track") ||
    flags.some((f) => /basketball|soccer|sport_team/.test(f));
  const fast = flags.some((f) => /fast_food_phase|fast_food/.test(f));
  const sed = flags.some((f) => /sedentary_phase|sedentary/.test(f));
  const sex: PlayableSex = ath ? "man" : "woman";
  const adult = ath ? 71 : 63;
  let hi = roundHeightInches(heightAtAge(age, adult, sex));
  hi = clamp(hi, MIN_HEIGHT_IN, MAX_HEIGHT_IN);
  const bmiGuess =
    targetBmiFromHealth(72, fast || sed ? 0.35 : -0.15, flags) +
    (fast ? 0.8 : 0) +
    (sed ? 0.5 : 0) -
    (ath ? 0.9 : 0);
  let wi = weightFromBmi(clamp(bmiGuess, 17, 30), hi);
  wi = clamp(wi, MIN_WEIGHT_LB, MAX_WEIGHT_LB);
  return roundPhysique(hi, wi);
}

/** Each birthday: height along adult target curve; weight tracks health-linked BMI + lifestyle. */
function applyBirthdayPhysique(s: GameState, year: number): GameState {
  const sex = physiqueSex(s);
  const adult =
    typeof s.adultHeightInches === "number" &&
    Number.isFinite(s.adultHeightInches)
      ? s.adultHeightInches
      : inferAdultHeightFromCurrent(s, s.heightInches);
  let heightInches = roundHeightInches(heightAtAge(year, adult, sex));
  heightInches = clamp(heightInches, MIN_HEIGHT_IN, MAX_HEIGHT_IN);

  let weightLbs = s.weightLbs;
  let { health, happiness } = s;

  let wGain = year < 14 ? 2.3 : year < 21 ? 2.9 : year < 40 ? 1.7 : 1.2;
  if (s.flags.some((f) => /fast_food_phase|fast_food/.test(f))) wGain += 2.5;
  if (s.flags.some((f) => /sedentary_phase|sedentary/.test(f))) wGain += 1.3;
  if (s.flags.includes("athlete_track")) wGain -= 1.6;
  if (s.northStar === "Athlete") wGain -= 1.3;
  if (year > 40) wGain += 0.5;
  if (year > 60) wGain += 0.85;
  weightLbs += wGain;

  const nature =
    typeof s.physiqueNature === "number" && Number.isFinite(s.physiqueNature)
      ? s.physiqueNature
      : 0;
  const targetBmi = targetBmiFromHealth(health, nature, s.flags);
  const idealW = weightFromBmi(targetBmi, heightInches);
  weightLbs = weightLbs * 0.45 + idealW * 0.55;

  weightLbs = clamp(weightLbs, MIN_WEIGHT_LB, MAX_WEIGHT_LB);

  const r = roundPhysique(heightInches, weightLbs);
  heightInches = r.heightInches;
  weightLbs = r.weightLbs;
  const b = (weightLbs / (heightInches * heightInches)) * 703;
  if (b >= 35) {
    health -= 2;
    happiness -= 1;
  } else if (b >= 30) {
    health -= 1;
  } else if (b >= 28) {
    happiness -= 1;
  } else if (b < 17.5) health -= 1;

  return {
    ...s,
    adultHeightInches: roundHeightInches(adult),
    heightInches,
    weightLbs,
    health: clamp(health, MIN_STAT, MAX_STAT),
    happiness: clamp(happiness, MIN_STAT, MAX_STAT),
  };
}

/** Legacy JSON used `money`; still honor it for one-off deltas. */
function statDeltaAssets(d: StatDelta | undefined): number | undefined {
  if (!d) return undefined;
  if (d.assets !== undefined) return d.assets;
  const legacy = d as unknown as { money?: number };
  if (legacy.money !== undefined) return legacy.money;
  return undefined;
}

/** Smarter characters gain a little health, mood, and assets each time they age up. */
function applyIntelligenceLifestyleBonus(state: GameState): GameState {
  const i = state.intelligence;
  const healthNudge = Math.floor(i / 28);
  const happyNudge = Math.floor(i / 32);
  const assetsNudge = Math.floor(i / 22) * 20;
  const mult = physiqueAssetMultiplier(state);
  return {
    ...state,
    health: clamp(state.health + healthNudge, MIN_STAT, MAX_STAT),
    happiness: clamp(state.happiness + happyNudge, MIN_STAT, MAX_STAT),
    assets: state.assets + Math.round(assetsNudge * mult),
  };
}

/**
 * Per birthday: physique, happiness drift, then stochastic mortality from an
 * OECD-style age curve scaled by residence + lifestyle (replaces flat health ladder).
 * Multi-year jumps stop at the year of death if applicable.
 */
function applyAgingDrift(
  state: GameState,
  ageBefore: number,
  ageAfter: number,
): GameState {
  if (ageAfter <= ageBefore) return state;
  let next = { ...state };
  for (let y = ageBefore + 1; y <= ageAfter; y++) {
    next = applyBirthdayPhysique(next, y);
    if (next.gamePhase === "dead") break;
    if (y >= 30) {
      next = {
        ...next,
        happiness: clamp(next.happiness - 1, MIN_STAT, MAX_STAT),
      };
    }
    if (y >= 18 && next.gamePhase === "living") {
      const p = annualDeathProbabilityFromState(next, y, computeBmi(next));
      if (Math.random() < p) {
        next = resolveFatalHealth({
          ...next,
          age: y,
          health: 0,
          deathCause: "natural",
        });
        break;
      }
    }
  }
  return next;
}

function applyImmersionLanguageRules(state: GameState): GameState {
  const birth = state.homeCountryId;
  const live = state.residenceCountryId;
  const homeLangBirth = countryPrimaryLang(birth);
  const homeLangLive =
    live !== RESIDENCE_NOMAD_ID ? countryPrimaryLang(live) : null;
  const levels = { ...state.languageLevels };
  let changed = false;
  for (const [cid, count] of Object.entries(state.visitPlacesByCountry)) {
    if (count < immersionThresholdBasic()) continue;
    const lang = countryImmersionLang(cid);
    if (!lang) continue;
    if (cid === birth && lang === homeLangBirth) continue;
    if (
      live !== RESIDENCE_NOMAD_ID &&
      cid === live &&
      homeLangLive &&
      lang === homeLangLive
    ) {
      continue;
    }
    const target: LanguageLevel =
      count >= immersionThresholdProficient() ? "proficient" : "basic";
    const merged = mergeLanguageLevel(levels[lang], target);
    if (merged !== levels[lang]) {
      levels[lang] = merged;
      changed = true;
    }
  }
  return changed ? { ...state, languageLevels: levels } : state;
}

function applyDelta(state: GameState, d: StatDelta | undefined): GameState {
  if (!d) return clampMinorFinances(state);
  let {
    age,
    health,
    happiness,
    intelligence,
    socialSkill,
    romanticSkill,
    assets,
    debt,
    legacyFamilyHarmony,
    legacyRepute,
    legacyGenerosity,
    legacyHeirReadiness,
    lifetimeDonatedTotal,
    heightInches,
    weightLbs,
  } = state;
  if (d.health !== undefined) health += d.health;
  if (d.happiness !== undefined) happiness += d.happiness;
  const daRaw = statDeltaAssets(d);
  if (daRaw !== undefined) {
    if (daRaw > 0) {
      assets += Math.round(daRaw * physiqueAssetMultiplier(state));
    } else {
      assets += daRaw;
    }
  }
  if (d.debt !== undefined) {
    debt = Math.max(0, debt + d.debt);
  }
  if (d.intelligence !== undefined) intelligence += d.intelligence;
  if (d.socialSkill !== undefined) socialSkill += d.socialSkill;
  if (d.romanticSkill !== undefined) romanticSkill += d.romanticSkill;
  if (d.legacyFamilyHarmony !== undefined) {
    legacyFamilyHarmony += d.legacyFamilyHarmony;
  }
  if (d.legacyRepute !== undefined) legacyRepute += d.legacyRepute;
  if (d.legacyGenerosity !== undefined) legacyGenerosity += d.legacyGenerosity;
  if (d.legacyHeirReadiness !== undefined) {
    legacyHeirReadiness += d.legacyHeirReadiness;
  }
  if (d.lifetimeDonatedDelta !== undefined) {
    lifetimeDonatedTotal = Math.max(0, lifetimeDonatedTotal + d.lifetimeDonatedDelta);
  }
  if (d.heightInches !== undefined) heightInches += d.heightInches;
  if (d.weightLbs !== undefined) weightLbs += d.weightLbs;
  let kidsCount = state.kidsCount;
  let grandkidsCount = state.grandkidsCount;
  if (d.kidsCountDelta !== undefined) {
    kidsCount = clamp(
      kidsCount + Math.trunc(d.kidsCountDelta),
      0,
      20,
    );
  }
  if (d.grandkidsCountDelta !== undefined) {
    grandkidsCount = clamp(
      grandkidsCount + Math.trunc(d.grandkidsCountDelta),
      0,
      30,
    );
  }
  const physR = roundPhysique(
    clamp(heightInches, MIN_HEIGHT_IN, MAX_HEIGHT_IN),
    clamp(weightLbs, MIN_WEIGHT_LB, MAX_WEIGHT_LB),
  );
  heightInches = physR.heightInches;
  weightLbs = physR.weightLbs;
  const ageBefore = age;
  if (d.ageDelta !== undefined) age += d.ageDelta;

  let countriesVisited = [...state.countriesVisited];
  if (d.countriesVisitedAdd?.length) {
    const set = new Set(countriesVisited);
    for (const c of d.countriesVisitedAdd) {
      const id = String(c).slice(0, 8);
      if (id) set.add(id);
    }
    countriesVisited = [...set];
  }

  const visitPlacesByCountry = { ...state.visitPlacesByCountry };
  for (const row of d.visitPlacesAdd ?? []) {
    const id = String(row.countryId).slice(0, 8);
    const n = Math.max(0, Math.min(99, Math.floor(Number(row.places))));
    if (!id || n <= 0) continue;
    visitPlacesByCountry[id] = (visitPlacesByCountry[id] ?? 0) + n;
  }

  const languageLevels = { ...state.languageLevels };
  for (const row of d.languageLevelsSet ?? []) {
    const code = String(row.code).slice(0, 12);
    if (!code) continue;
    languageLevels[code] = mergeLanguageLevel(
      languageLevels[code],
      row.level,
    );
  }

  let residenceCountryId = state.residenceCountryId;
  if (d.setResidenceCountryId !== undefined) {
    const token = String(d.setResidenceCountryId).trim().toLowerCase();
    if (token === "@birth") {
      residenceCountryId = state.homeCountryId;
    } else if (token === RESIDENCE_NOMAD_ID) {
      residenceCountryId = RESIDENCE_NOMAD_ID;
    } else {
      const cid = token.slice(0, 8);
      if (getCountryDef(cid)) residenceCountryId = cid;
    }
  }

  let next: GameState = {
    ...state,
    age,
    health: clamp(health, MIN_STAT, MAX_STAT),
    happiness: clamp(happiness, MIN_STAT, MAX_STAT),
    intelligence: clamp(intelligence, MIN_STAT, MAX_STAT),
    socialSkill: clamp(socialSkill, MIN_STAT, MAX_STAT),
    romanticSkill: clamp(romanticSkill, MIN_STAT, MAX_STAT),
    assets,
    debt,
    legacyFamilyHarmony: clamp(legacyFamilyHarmony, MIN_STAT, MAX_STAT),
    legacyRepute: clamp(legacyRepute, MIN_STAT, MAX_STAT),
    legacyGenerosity: clamp(legacyGenerosity, MIN_STAT, MAX_STAT),
    legacyHeirReadiness: clamp(legacyHeirReadiness, MIN_STAT, MAX_STAT),
    lifetimeDonatedTotal,
    heightInches,
    weightLbs,
    countriesVisited,
    visitPlacesByCountry,
    languageLevels,
    residenceCountryId,
    kidsCount,
    grandkidsCount,
  };

  next = applyImmersionLanguageRules(next);

  if (d.ageDelta !== undefined && d.ageDelta > 0 && age > ageBefore) {
    next = applyIntelligenceLifestyleBonus(next);
    next = applyAgingDrift(next, ageBefore, age);
  }

  return clampMinorFinances(next);
}

function mergeFlags(flags: string[], add: string[] | undefined): string[] {
  if (!add?.length) return flags;
  const set = new Set(flags);
  for (const f of add) set.add(f);
  return [...set];
}

function stripAthleteTrack(flags: string[]): string[] {
  return flags.filter((f) => f !== "athlete_track");
}

function exposureCountryForConflict(state: GameState): string {
  return state.residenceCountryId === RESIDENCE_NOMAD_ID
    ? state.homeCountryId
    : state.residenceCountryId;
}

function initialRegionalConflictNextEventAge(homeCountryId: string): number {
  if (!isRegionalConflictProneCountry(homeCountryId)) return 999;
  return Math.min(95, 11 + Math.floor(Math.random() * 9));
}

function applyRegionalConflictPulseIfDue(
  state: GameState,
  locale: AppLocale,
): GameState {
  const country = exposureCountryForConflict(state);
  if (!isRegionalConflictProneCountry(country)) return state;
  if (state.age < state.regionalConflictNextEventAge) return state;

  let next = applyDelta(state, {
    happiness: -14,
    health: -8,
    intelligence: -4,
    socialSkill: -3,
  });
  const gap = 5 + Math.floor(Math.random() * 6);
  const syn = syntheticLifeLogStrings("regional_conflict", locale);
  next = {
    ...next,
    regionalConflictNextEventAge: Math.min(120, next.age + gap),
    flags: mergeFlags(next.flags, ["felt_regional_conflict_wave"]),
    lifeLog: [
      ...next.lifeLog,
      {
        age: next.age,
        nodeId: "regional_conflict",
        nodeTitle: syn.nodeTitle,
        choiceLabel: syn.choiceLabel,
      },
    ].slice(-25),
  };
  return next;
}

function applyMilitaryInjuryRecoveryIfDue(
  state: GameState,
  nodeId: string,
  locale: AppLocale,
): GameState {
  if (nodeId !== "year_19") return state;
  if (!state.flags.includes("military_service_injury")) return state;
  if (state.flags.includes("military_injury_recovered")) return state;
  let next = applyDelta(state, {
    health: 12,
    happiness: 14,
    socialSkill: 2,
  });
  const syn = syntheticLifeLogStrings("military_rehab", locale);
  next = {
    ...next,
    flags: mergeFlags(next.flags, ["military_injury_recovered"]),
    lifeLog: [
      ...next.lifeLog,
      {
        age: next.age,
        nodeId: "military_service",
        nodeTitle: syn.nodeTitle,
        choiceLabel: syn.choiceLabel,
      },
    ].slice(-25),
  };
  return next;
}

/** After base choice deltas — death ~1%, serious injury ~3%, else completed clean. */
function applyMilitaryServiceOutcomes(
  state: GameState,
  choiceId: string,
  locale: AppLocale,
): GameState {
  if (choiceId !== "year_18_military_service") return state;
  const r = Math.random();
  if (r < 0.01) {
    return resolveFatalHealth({
      ...state,
      health: 0,
      deathCause: "killed_in_service",
    });
  }
  if (r < 0.04) {
    let next = applyDelta(state, {
      health: -18,
      happiness: -22,
      intelligence: -3,
      socialSkill: -4,
    });
    const syn = syntheticLifeLogStrings("military_injury", locale);
    next = {
      ...next,
      flags: mergeFlags(stripAthleteTrack(next.flags), [
        "military_service_injury",
        "athlete_path_blocked",
      ]),
      lifeLog: [
        ...next.lifeLog,
        {
          age: next.age,
          nodeId: "military_service",
          nodeTitle: syn.nodeTitle,
          choiceLabel: syn.choiceLabel,
        },
      ].slice(-25),
    };
    return next;
  }
  return {
    ...state,
    flags: mergeFlags(state.flags, ["military_service_completed"]),
  };
}

/** Lump sum from parents when you choose a path after young adulthood — scales with how “together” you look. */
function applyParentStipend(state: GameState): GameState {
  let gift =
    260 +
    Math.floor(
      state.happiness * 6 +
        state.intelligence * 12 +
        state.socialSkill * 5 +
        state.romanticSkill * 2,
    );
  if (state.intelligence >= 68) gift += 420;
  if (state.happiness >= 88) gift += 380;
  if (state.socialSkill >= 72) gift += 200;
  if (state.northStar === "Social media creator") {
    gift = Math.floor(gift * 0.87);
  }
  if (
    state.flags.some((f) =>
      /smoking|fast_food|sedentary|party_phase|heavy_drinker|spent_on_vice/.test(
        f,
      ),
    )
  ) {
    gift = Math.floor(gift * 0.84);
  }
  gift = Math.min(gift, 6800);
  gift = Math.round(gift * physiqueAssetMultiplier(state));
  return { ...state, assets: state.assets + gift };
}

const AVATAR_SKIN_MAX = 3;
const AVATAR_HAIR_COLOR_MAX = 6;
/** Numbered styles in character setup (see `avatar-nice` SETUP_HAIR_STYLE_COUNT). */
const AVATAR_HAIR_STYLE_MAX = 5;

export function normalizeAvatar(raw: unknown): AvatarLook {
  const d: AvatarLook = { skinTone: 0, hairColor: 0, hairStyle: 0 };
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  return {
    skinTone: clamp(
      typeof o.skinTone === "number" ? Math.floor(o.skinTone) : 0,
      0,
      AVATAR_SKIN_MAX,
    ),
    hairColor: clamp(
      typeof o.hairColor === "number" ? Math.floor(o.hairColor) : 0,
      0,
      AVATAR_HAIR_COLOR_MAX,
    ),
    hairStyle: clamp(
      typeof o.hairStyle === "number" ? Math.floor(o.hairStyle) : 0,
      0,
      AVATAR_HAIR_STYLE_MAX,
    ),
  };
}

/** Baseline when stored JSON omits a stat (aligned with age-8 create). */
const DEFAULT_INTELLIGENCE_KID = 20;
const DEFAULT_SOCIAL_KID = 24;
const DEFAULT_ROMANTIC_KID = 14;

export function createInitialState(): GameState {
  const placeholderSex: PlayableSex = "woman";
  const h8 = roundHeightInches(
    heightAtAge(8, PLACEHOLDER_ADULT_HEIGHT_IN, placeholderSex),
  );
  const w8 = Math.round(
    weightFromBmi(
      targetBmiFromHealth(80, 0, []),
      h8,
    ) * 10,
  ) / 10;
  return {
    characterName: "",
    avatar: { skinTone: 0, hairColor: 0, hairStyle: 0 },
    age: 8,
    health: 80,
    happiness: 99,
    intelligence: DEFAULT_INTELLIGENCE_KID,
    socialSkill: DEFAULT_SOCIAL_KID,
    romanticSkill: DEFAULT_ROMANTIC_KID,
    assets: 0,
    debt: 0,
    homeValue: 0,
    homeLabel: "Parents' house",
    flags: [],
    northStar: "Undecided",
    lifeLog: [],
    achievementIds: [],
    currentNodeId: getStartNodeId(),
    contentVersion: CONTENT_VERSION,
    legacyFamilyHarmony: DEFAULT_LEGACY,
    legacyRepute: DEFAULT_LEGACY,
    legacyGenerosity: DEFAULT_LEGACY,
    legacyHeirReadiness: DEFAULT_LEGACY,
    lifetimeDonatedTotal: 0,
    adultHeightInches: PLACEHOLDER_ADULT_HEIGHT_IN,
    physiqueNature: 0,
    heightInches: h8,
    weightLbs: w8,
    gamePhase: "living",
    homeCountryId: "us",
    countriesVisited: [],
    visitPlacesByCountry: {},
    languageLevels: { en: "native" },
    residenceCountryId: "us",
    regionalConflictNextEventAge: 999,
    kidsCount: 0,
    grandkidsCount: 0,
  };
}

/** After character creation screen; does not apply choice deltas. */
export function completeCharacterSetup(
  state: GameState,
  opts: {
    characterName: string;
    avatar: AvatarLook;
    avatarNice: StoredNiceAvatarConfig;
    homeCountryId: string;
  },
  locale: AppLocale = "en",
): GameState {
  const characterName = opts.characterName.trim().slice(0, 40) || "Traveler";
  const avatar = normalizeAvatar(opts.avatar);
  const homeCountryId = opts.homeCountryId.trim().slice(0, 8) || "us";
  const nativeLang = countryPrimaryLang(homeCountryId);
  const languageLevels: GameState["languageLevels"] =
    homeCountryId === "il"
      ? { he: "native", en: "knowledgeable" }
      : { [nativeLang]: "native" };
  const sex: PlayableSex = opts.avatarNice.sex === "man" ? "man" : "woman";
  const { lo, hi } = adultHeightBounds(sex);
  const adultHeightInches = roundHeightInches(lo + Math.random() * (hi - lo));
  const physiqueNature =
    Math.round(((Math.random() * 2 - 1) * 1.2 + (Math.random() - 0.5) * 0.6) * 100) /
    100;
  const heightInches = roundHeightInches(
    heightAtAge(state.age, adultHeightInches, sex),
  );
  const weightLbs = Math.round(
    weightFromBmi(
      targetBmiFromHealth(state.health, physiqueNature, state.flags),
      heightInches,
    ) * 10,
  ) / 10;

  const next: GameState = {
    ...state,
    characterName,
    avatar,
    avatarNice: opts.avatarNice,
    currentNodeId: "prologue_north_star",
    homeCountryId,
    residenceCountryId: homeCountryId,
    countriesVisited: [],
    visitPlacesByCountry: {},
    languageLevels,
    regionalConflictNextEventAge: initialRegionalConflictNextEventAge(
      homeCountryId,
    ),
    adultHeightInches,
    physiqueNature,
    heightInches,
    weightLbs,
  };
  return applyOnEnterIfNeeded(next, locale);
}

/** Israeli characters: English rises with serious school study; otherwise stays “knowledgeable”. */
function applyIsraelEnglishSchoolTrack(
  state: GameState,
  choiceId: string,
): GameState {
  if (state.homeCountryId !== "il") return state;
  const prof = new Set([
    "year_13_a", // honor-roll energy
    "year_14_a", // map classes / grind
    "year_16_c", // tunnel vision grades
    "year_17_a", // campus tours / college prep
    "college",
    "year_20_c", // certs / night classes
  ]);
  const know = new Set([
    "year_13_b",
    "year_13_c",
    "year_14_b",
    "year_14_c",
    "year_16_a",
    "year_16_b",
    "year_16_date_splurge",
    "year_16_lang_es",
    "year_16_lang_fr",
    "year_16_lang_zh",
    "year_17_b",
    "year_17_c",
    "year_17_prom",
    "work",
    "gap",
    "year_20_a",
    "year_20_b",
    "year_20_lang_studio",
    "year_20_social_flop",
    "year_20_social_hit",
  ]);
  if (prof.has(choiceId)) {
    return {
      ...state,
      languageLevels: {
        ...state.languageLevels,
        en: mergeLanguageLevel(state.languageLevels.en, "proficient"),
      },
    };
  }
  if (know.has(choiceId)) {
    return {
      ...state,
      languageLevels: {
        ...state.languageLevels,
        en: mergeLanguageLevel(state.languageLevels.en, "knowledgeable"),
      },
    };
  }
  return state;
}

function choiceIsVisible(state: GameState, choice: Choice): boolean {
  if (state.gamePhase === "dead") return false;
  if (
    choice.showForNorthStar !== undefined &&
    choice.showForNorthStar !== "" &&
    state.northStar !== choice.showForNorthStar
  ) {
    return false;
  }
  if (
    choice.hideForNorthStar !== undefined &&
    choice.hideForNorthStar !== "" &&
    state.northStar === choice.hideForNorthStar
  ) {
    return false;
  }
  if (
    choice.hideIfHomeCountry !== undefined &&
    choice.hideIfHomeCountry !== "" &&
    state.homeCountryId === choice.hideIfHomeCountry
  ) {
    return false;
  }
  if (choice.minNetWorth !== undefined) {
    const nw = state.assets - state.debt;
    if (nw < choice.minNetWorth) return false;
  }
  if (choice.requiredFlags?.length) {
    for (const f of choice.requiredFlags) {
      if (!state.flags.includes(f)) return false;
    }
  }
  if (choice.hideIfAnyFlags?.length) {
    for (const f of choice.hideIfAnyFlags) {
      if (state.flags.includes(f)) return false;
    }
  }
  if (choice.showIfCountryIn?.length) {
    const hit = choice.showIfCountryIn.some(
      (c) =>
        state.homeCountryId === c ||
        (state.residenceCountryId !== RESIDENCE_NOMAD_ID &&
          state.residenceCountryId === c),
    );
    if (!hit) return false;
  }
  return true;
}

/** Choices rendered in the UI (same order as in content; indices match `applyChoice`). */
export function getVisibleChoices(
  state: GameState,
  node: LifeNode,
): { choice: Choice; index: number }[] {
  return node.choices
    .map((choice, index) => ({ choice, index }))
    .filter(({ choice }) => choiceIsVisible(state, choice));
}

/** True when node has no navigable choices (demo ending). */
export function isAtTerminal(state: GameState): boolean {
  const node = getNode(state.currentNodeId);
  if (!node) return true;
  if (node.id === "character_setup") return false;
  const visible = getVisibleChoices(state, node);
  if (visible.length === 0) return true;
  return visible.every((v) => v.choice.nextNodeId === null);
}

export function applyOnEnterIfNeeded(
  state: GameState,
  locale: AppLocale = "en",
): GameState {
  const node = getNode(state.currentNodeId);
  if (!node) return state;

  let next: GameState = node.onEnter
    ? applyDelta(state, node.onEnter)
    : clampMinorFinances(state);

  if (node.onEnterSetHome) {
    next = {
      ...next,
      homeValue: node.onEnterSetHome.value,
      homeLabel: node.onEnterSetHome.label,
    };
  }

  if (node.onEnterEffects?.includes("parent_stipend")) {
    next = applyParentStipend(next);
  }

  next = applyMilitaryInjuryRecoveryIfDue(next, node.id, locale);
  next = applyRegionalConflictPulseIfDue(next, locale);

  return resolveFatalHealth(clampMinorFinances(next));
}

export function applyChoice(
  state: GameState,
  choiceIndex: number,
  locale: AppLocale = "en",
): GameState {
  const node = getNode(state.currentNodeId);
  if (!node) throw new Error(`Unknown node: ${state.currentNodeId}`);
  const choice = node.choices[choiceIndex];
  if (!choice) throw new Error(`Invalid choice index: ${choiceIndex}`);

  const homeFromChoice = choice.setHome;

  const logEntry: LifeLogEntry = {
    age: state.age,
    nodeId: node.id,
    nodeTitle: localizedNodeTitleForLog(
      node.id,
      node.title,
      node.id,
      locale,
    ).slice(0, 80),
    choiceLabel: localizedChoiceLabel(
      node.id,
      choice.id,
      choice.label,
      locale,
    ).slice(0, 200),
  };
  const lifeLog =
    node.id === "character_setup"
      ? state.lifeLog
      : [...state.lifeLog, logEntry].slice(-25);

  let next: GameState = {
    ...state,
    lifeLog,
    flags: mergeFlags(state.flags, choice.flagsAdd),
    northStar: choice.setNorthStar ?? state.northStar,
    homeValue: homeFromChoice?.value ?? state.homeValue,
    homeLabel: homeFromChoice?.label ?? state.homeLabel,
  };
  next = applyDelta(next, choice.deltas);
  next = applyIsraelEnglishSchoolTrack(next, choice.id);
  next = applyMilitaryServiceOutcomes(next, choice.id, locale);

  if (next.health <= 0) {
    return resolveFatalHealth(next);
  }

  if (choice.nextNodeId === null) {
    return unlockAchievements({
      ...next,
      currentNodeId: state.currentNodeId,
    });
  }

  next = { ...next, currentNodeId: choice.nextNodeId };
  next = applyOnEnterIfNeeded(next, locale);
  return unlockAchievements(next);
}

/** Snapshot of how vitals changed after a choice (includes next-node `onEnter` and age-up bonuses). */
export type StatDiffSummary = {
  health: number;
  happiness: number;
  intelligence: number;
  socialSkill: number;
  romanticSkill: number;
  assets: number;
  debt: number;
  age: number;
  legacyFamilyHarmony: number;
  legacyRepute: number;
  legacyGenerosity: number;
  legacyHeirReadiness: number;
  lifetimeDonatedTotal: number;
  heightInches: number;
  weightLbs: number;
};

export function diffStatSnapshot(
  before: GameState,
  after: GameState,
): StatDiffSummary {
  return {
    health: after.health - before.health,
    happiness: after.happiness - before.happiness,
    intelligence: after.intelligence - before.intelligence,
    socialSkill: after.socialSkill - before.socialSkill,
    romanticSkill: after.romanticSkill - before.romanticSkill,
    assets: after.assets - before.assets,
    debt: after.debt - before.debt,
    age: after.age - before.age,
    legacyFamilyHarmony: after.legacyFamilyHarmony - before.legacyFamilyHarmony,
    legacyRepute: after.legacyRepute - before.legacyRepute,
    legacyGenerosity: after.legacyGenerosity - before.legacyGenerosity,
    legacyHeirReadiness: after.legacyHeirReadiness - before.legacyHeirReadiness,
    lifetimeDonatedTotal: after.lifetimeDonatedTotal - before.lifetimeDonatedTotal,
    heightInches: after.heightInches - before.heightInches,
    weightLbs: after.weightLbs - before.weightLbs,
  };
}

export function applyChoiceWithPreview(
  state: GameState,
  choiceIndex: number,
  locale: AppLocale = "en",
): { next: GameState; diff: StatDiffSummary } {
  const next = applyChoice(state, choiceIndex, locale);
  return { next, diff: diffStatSnapshot(state, next) };
}

function parseLifeLog(raw: unknown): LifeLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: LifeLogEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    if (typeof e.age !== "number") continue;
    if (typeof e.nodeId !== "string") continue;
    out.push({
      age: e.age,
      nodeId: e.nodeId.slice(0, 64),
      nodeTitle:
        typeof e.nodeTitle === "string"
          ? e.nodeTitle.slice(0, 80)
          : e.nodeId.slice(0, 80),
      choiceLabel:
        typeof e.choiceLabel === "string" ? e.choiceLabel.slice(0, 200) : "",
    });
  }
  return out.slice(-40);
}

function parseAchievementIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((id) => id.slice(0, 64))
    .slice(0, 64);
}

function parseCountriesVisited(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.slice(0, 8))
    .filter(Boolean);
  return [...new Set(ids)];
}

function parseVisitPlacesByCountry(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out[k.slice(0, 8)] = Math.max(0, Math.min(999, Math.floor(v)));
  }
  return out;
}

function parseLanguageLevels(raw: unknown): Record<string, LanguageLevel> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, LanguageLevel> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const code = k.slice(0, 12);
    if (!code) continue;
    if (
      v === "native" ||
      v === "proficient" ||
      v === "knowledgeable" ||
      v === "basic"
    ) {
      out[code] = v;
    }
  }
  return out;
}

function patchLegacyDefaults(state: GameState): GameState {
  const { deathCause: priorDeath, ...base } = state;
  const raw = state as unknown as {
    legacyFamilyHarmony?: unknown;
    legacyRepute?: unknown;
    legacyGenerosity?: unknown;
    legacyHeirReadiness?: unknown;
    lifetimeDonatedTotal?: unknown;
    gamePhase?: unknown;
    deathCause?: unknown;
    heightInches?: unknown;
    weightLbs?: unknown;
    homeCountryId?: unknown;
    residenceCountryId?: unknown;
    countriesVisited?: unknown;
    visitPlacesByCountry?: unknown;
    languageLevels?: unknown;
    regionalConflictNextEventAge?: unknown;
    adultHeightInches?: unknown;
    physiqueNature?: unknown;
    kidsCount?: unknown;
    grandkidsCount?: unknown;
  };
  const phase: GameState["gamePhase"] =
    raw.gamePhase === "dead" ? "dead" : "living";
  const legacyFamilyHarmony = clamp(
    typeof raw.legacyFamilyHarmony === "number"
      ? raw.legacyFamilyHarmony
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyRepute = clamp(
    typeof raw.legacyRepute === "number"
      ? raw.legacyRepute
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyGenerosity = clamp(
    typeof raw.legacyGenerosity === "number"
      ? raw.legacyGenerosity
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyHeirReadiness = clamp(
    typeof raw.legacyHeirReadiness === "number"
      ? raw.legacyHeirReadiness
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const lifetimeDonatedTotal =
    typeof raw.lifetimeDonatedTotal === "number"
      ? Math.max(0, raw.lifetimeDonatedTotal)
      : 0;
  const heightRaw = clamp(
    typeof raw.heightInches === "number" ? raw.heightInches : 50,
    MIN_HEIGHT_IN,
    MAX_HEIGHT_IN,
  );
  const weightRaw = clamp(
    typeof raw.weightLbs === "number" ? raw.weightLbs : KID_START_WEIGHT,
    MIN_WEIGHT_LB,
    MAX_WEIGHT_LB,
  );
  const hadStoredAdult =
    typeof raw.adultHeightInches === "number" &&
    Number.isFinite(raw.adultHeightInches);
  const tmpState = {
    ...base,
    heightInches: heightRaw,
    weightLbs: weightRaw,
  } as GameState;
  const { adultHeightInches, physiqueNature } = resolveAdultHeightAndNature(
    state as GameState,
    heightRaw,
  );
  let syncHeight = heightRaw;
  let syncWeight = weightRaw;
  if (!hadStoredAdult) {
    syncHeight = roundHeightInches(
      heightAtAge(base.age, adultHeightInches, physiqueSex(tmpState)),
    );
    syncHeight = clamp(syncHeight, MIN_HEIGHT_IN, MAX_HEIGHT_IN);
    syncWeight = Math.round(
      weightFromBmi(
        targetBmiFromHealth(base.health, physiqueNature, base.flags),
        syncHeight,
      ) * 10,
    ) / 10;
    syncWeight = clamp(syncWeight, MIN_WEIGHT_LB, MAX_WEIGHT_LB);
  }
  const physiqueRounded = roundPhysique(syncHeight, syncWeight);
  const homeCountryId =
    typeof raw.homeCountryId === "string" && raw.homeCountryId.trim()
      ? raw.homeCountryId.trim().slice(0, 8)
      : "us";
  const residenceRaw =
    typeof raw.residenceCountryId === "string"
      ? raw.residenceCountryId.trim().toLowerCase().slice(0, 8)
      : "";
  const residenceCountryId =
    residenceRaw === RESIDENCE_NOMAD_ID
      ? RESIDENCE_NOMAD_ID
      : residenceRaw && getCountryDef(residenceRaw)
        ? residenceRaw
        : homeCountryId;
  const countriesVisited = parseCountriesVisited(raw.countriesVisited);
  const visitPlacesByCountry = parseVisitPlacesByCountry(
    raw.visitPlacesByCountry,
  );
  let languageLevels = parseLanguageLevels(raw.languageLevels);
  const nat = countryPrimaryLang(homeCountryId);
  if (Object.keys(languageLevels).length === 0) {
    languageLevels = { [nat]: "native" };
  }
  if (homeCountryId === "il") {
    languageLevels = {
      ...languageLevels,
      he: mergeLanguageLevel(languageLevels.he, "native"),
      en: mergeLanguageLevel(languageLevels.en, "knowledgeable"),
    };
  }
  const deathCause =
    phase === "dead"
      ? (typeof raw.deathCause === "string"
          ? raw.deathCause
          : typeof priorDeath === "string"
            ? priorDeath
            : "health"
        ).slice(0, 80)
      : undefined;
  const exposureCountry =
    residenceCountryId === RESIDENCE_NOMAD_ID
      ? homeCountryId
      : residenceCountryId;
  const regionalConflictNextEventAge =
    typeof raw.regionalConflictNextEventAge === "number" &&
    Number.isFinite(raw.regionalConflictNextEventAge)
      ? clamp(
          Math.floor(raw.regionalConflictNextEventAge),
          8,
          120,
        )
      : isRegionalConflictProneCountry(homeCountryId) ||
          isRegionalConflictProneCountry(exposureCountry)
        ? Math.min(95, Math.max(base.age + 1, 13))
        : 999;
  let kidsCount =
    typeof raw.kidsCount === "number" && Number.isFinite(raw.kidsCount)
      ? clamp(Math.floor(raw.kidsCount), 0, 20)
      : 0;
  let grandkidsCount =
    typeof raw.grandkidsCount === "number" &&
    Number.isFinite(raw.grandkidsCount)
      ? clamp(Math.floor(raw.grandkidsCount), 0, 30)
      : 0;
  if (kidsCount === 0 && base.flags.includes("has_kids")) kidsCount = 1;
  if (grandkidsCount === 0 && base.flags.includes("has_grandkids")) {
    grandkidsCount = 1;
  }
  return {
    ...base,
    legacyFamilyHarmony,
    legacyRepute,
    legacyGenerosity,
    legacyHeirReadiness,
    lifetimeDonatedTotal,
    adultHeightInches,
    physiqueNature,
    heightInches: physiqueRounded.heightInches,
    weightLbs: physiqueRounded.weightLbs,
    homeCountryId,
    residenceCountryId,
    countriesVisited,
    visitPlacesByCountry,
    languageLevels,
    regionalConflictNextEventAge,
    kidsCount,
    grandkidsCount,
    gamePhase: phase,
    ...(deathCause ? { deathCause } : {}),
  };
}

function migrateLegacyState(state: GameState): GameState {
  const raw = state as unknown as {
    money?: number;
    assets?: number;
    homeValue?: unknown;
    homeLabel?: unknown;
    northStar?: unknown;
    socialSkill?: unknown;
    romanticSkill?: unknown;
  };
  const assets =
    typeof raw.assets === "number"
      ? raw.assets
      : typeof raw.money === "number"
        ? raw.money
        : 0;

  const socialSkill =
    typeof raw.socialSkill === "number" ? raw.socialSkill : DEFAULT_SOCIAL_KID;
  const romanticSkill =
    typeof raw.romanticSkill === "number"
      ? raw.romanticSkill
      : DEFAULT_ROMANTIC_KID;

  let homeLabel =
    typeof raw.homeLabel === "string" && raw.homeLabel.trim().length > 0
      ? raw.homeLabel
      : "None";
  if (homeLabel === "None" && state.age <= 18) homeLabel = "Parents' house";

  const nameRaw = state as unknown as {
    characterName?: unknown;
    avatar?: unknown;
  };
  const characterName =
    typeof nameRaw.characterName === "string"
      ? nameRaw.characterName.slice(0, 40)
      : "You";

  const ext = state as unknown as {
    debt?: unknown;
    lifeLog?: unknown;
    achievementIds?: unknown;
    avatarNice?: unknown;
  };
  const debt = typeof ext.debt === "number" ? Math.max(0, ext.debt) : 0;
  const avatarNice = normalizeNiceAvatar(ext.avatarNice);
  const physiqueMig = estimatePhysiqueForMigration(state.age, state.flags);
  const tmpMig = {
    ...state,
    heightInches: physiqueMig.heightInches,
    weightLbs: physiqueMig.weightLbs,
    ...(avatarNice ? { avatarNice } : {}),
  } as GameState;
  const { adultHeightInches, physiqueNature } = resolveAdultHeightAndNature(
    tmpMig,
    physiqueMig.heightInches,
  );
  const migH = roundHeightInches(
    heightAtAge(state.age, adultHeightInches, physiqueSex(tmpMig)),
  );
  const migW = Math.round(
    weightFromBmi(
      targetBmiFromHealth(state.health, physiqueNature, state.flags),
      migH,
    ) * 10,
  ) / 10;
  const physiqueMig2 = roundPhysique(
    clamp(migH, MIN_HEIGHT_IN, MAX_HEIGHT_IN),
    clamp(migW, MIN_WEIGHT_LB, MAX_WEIGHT_LB),
  );

  const migrated: GameState = {
    characterName,
    avatar: normalizeAvatar(nameRaw.avatar),
    age: state.age,
    health: state.health,
    happiness: state.happiness,
    intelligence: clamp(
      state.intelligence ?? DEFAULT_INTELLIGENCE_KID,
      MIN_STAT,
      MAX_STAT,
    ),
    socialSkill: clamp(socialSkill, MIN_STAT, MAX_STAT),
    romanticSkill: clamp(romanticSkill, MIN_STAT, MAX_STAT),
    assets,
    debt,
    homeValue: typeof raw.homeValue === "number" ? raw.homeValue : 0,
    homeLabel,
    flags: state.flags,
    northStar:
      typeof raw.northStar === "string" && raw.northStar.trim().length > 0
        ? raw.northStar
        : "Undecided",
    lifeLog: parseLifeLog(ext.lifeLog),
    achievementIds: parseAchievementIds(ext.achievementIds),
    currentNodeId: state.currentNodeId,
    contentVersion: CONTENT_VERSION,
    legacyFamilyHarmony: DEFAULT_LEGACY,
    legacyRepute: DEFAULT_LEGACY,
    legacyGenerosity: DEFAULT_LEGACY,
    legacyHeirReadiness: DEFAULT_LEGACY,
    lifetimeDonatedTotal: 0,
    adultHeightInches,
    physiqueNature,
    heightInches: physiqueMig2.heightInches,
    weightLbs: physiqueMig2.weightLbs,
    homeCountryId: "us",
    residenceCountryId: "us",
    countriesVisited: [],
    visitPlacesByCountry: {},
    languageLevels: { en: "native" },
    gamePhase: "living",
    regionalConflictNextEventAge: 999,
    kidsCount: 0,
    grandkidsCount: 0,
    ...(avatarNice ? { avatarNice } : {}),
  };
  return clampMinorFinances(
    unlockAchievements(patchLegacyDefaults(migrated)),
  );
}

export function assertContentVersion(state: GameState): GameState {
  if (state.contentVersion === CONTENT_VERSION) {
    return clampMinorFinances(
      unlockAchievements(patchLegacyDefaults(state)),
    );
  }
  if (state.contentVersion < CONTENT_VERSION) {
    return migrateLegacyState(state);
  }
  return createInitialState();
}

export function validateStateShape(data: unknown): GameState | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.age !== "number") return null;
  if (typeof o.health !== "number") return null;
  if (typeof o.happiness !== "number") return null;
  if (!Array.isArray(o.flags) || !o.flags.every((f) => typeof f === "string"))
    return null;
  if (typeof o.currentNodeId !== "string") return null;
  if (typeof o.contentVersion !== "number") return null;

  const assets =
    typeof o.assets === "number"
      ? o.assets
      : typeof o.money === "number"
        ? o.money
        : null;
  if (assets === null) return null;

  const intelligence =
    typeof o.intelligence === "number"
      ? o.intelligence
      : DEFAULT_INTELLIGENCE_KID;
  const socialSkill =
    typeof o.socialSkill === "number" ? o.socialSkill : DEFAULT_SOCIAL_KID;
  const romanticSkill =
    typeof o.romanticSkill === "number"
      ? o.romanticSkill
      : DEFAULT_ROMANTIC_KID;

  const northStar =
    typeof o.northStar === "string" && o.northStar.trim().length > 0
      ? o.northStar
      : "Undecided";

  const homeValue = typeof o.homeValue === "number" ? o.homeValue : 0;
  const homeLabel =
    typeof o.homeLabel === "string" && o.homeLabel.trim().length > 0
      ? o.homeLabel
      : "Parents' house";

  const rawCn = o.characterName;
  const characterName =
    typeof rawCn === "string" ? rawCn.slice(0, 40) : "You";

  const debt =
    typeof o.debt === "number" ? Math.max(0, o.debt) : 0;
  const lifeLog = parseLifeLog(o.lifeLog);
  const achievementIds = parseAchievementIds(o.achievementIds);
  const avatarNice = normalizeNiceAvatar(o.avatarNice);

  const legacyFamilyHarmony = clamp(
    typeof o.legacyFamilyHarmony === "number"
      ? o.legacyFamilyHarmony
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyRepute = clamp(
    typeof o.legacyRepute === "number" ? o.legacyRepute : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyGenerosity = clamp(
    typeof o.legacyGenerosity === "number"
      ? o.legacyGenerosity
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const legacyHeirReadiness = clamp(
    typeof o.legacyHeirReadiness === "number"
      ? o.legacyHeirReadiness
      : DEFAULT_LEGACY,
    MIN_STAT,
    MAX_STAT,
  );
  const lifetimeDonatedTotal =
    typeof o.lifetimeDonatedTotal === "number"
      ? Math.max(0, o.lifetimeDonatedTotal)
      : 0;
  const gamePhase: GameState["gamePhase"] =
    o.gamePhase === "dead" ? "dead" : "living";
  const deathCause =
    gamePhase === "dead" && typeof o.deathCause === "string"
      ? o.deathCause.slice(0, 80)
      : undefined;

  const estPhy = estimatePhysiqueForMigration(o.age, o.flags as string[]);
  const heightRaw = typeof o.heightInches === "number" ? o.heightInches : null;
  const weightRaw = typeof o.weightLbs === "number" ? o.weightLbs : null;
  const physiqueParsed = roundPhysique(
    clamp(heightRaw ?? estPhy.heightInches, MIN_HEIGHT_IN, MAX_HEIGHT_IN),
    clamp(weightRaw ?? estPhy.weightLbs, MIN_WEIGHT_LB, MAX_WEIGHT_LB),
  );
  const hadStoredAdult =
    typeof o.adultHeightInches === "number" &&
    Number.isFinite(o.adultHeightInches);
  const partialForPhys = {
    age: o.age,
    health: o.health,
    happiness: o.happiness,
    flags: o.flags as string[],
    northStar,
    avatar: normalizeAvatar(o.avatar),
    avatarNice,
    heightInches: physiqueParsed.heightInches,
    weightLbs: physiqueParsed.weightLbs,
  } as GameState;
  const { adultHeightInches, physiqueNature } = resolveAdultHeightAndNature(
    partialForPhys,
    physiqueParsed.heightInches,
  );
  let hi = physiqueParsed.heightInches;
  let wi = physiqueParsed.weightLbs;
  if (!hadStoredAdult) {
    hi = roundHeightInches(
      heightAtAge(o.age, adultHeightInches, physiqueSex(partialForPhys)),
    );
    hi = clamp(hi, MIN_HEIGHT_IN, MAX_HEIGHT_IN);
    wi = Math.round(
      weightFromBmi(
        targetBmiFromHealth(o.health, physiqueNature, o.flags as string[]),
        hi,
      ) * 10,
    ) / 10;
    wi = clamp(wi, MIN_WEIGHT_LB, MAX_WEIGHT_LB);
  }
  const physiqueFinal = roundPhysique(hi, wi);

  const homeCountryIdRaw = o.homeCountryId;
  const homeCountryId =
    typeof homeCountryIdRaw === "string" && homeCountryIdRaw.trim()
      ? homeCountryIdRaw.trim().slice(0, 8)
      : "us";
  const resRaw =
    typeof o.residenceCountryId === "string"
      ? o.residenceCountryId.trim().toLowerCase().slice(0, 8)
      : "";
  const residenceCountryId =
    resRaw === RESIDENCE_NOMAD_ID
      ? RESIDENCE_NOMAD_ID
      : resRaw && getCountryDef(resRaw)
        ? resRaw
        : homeCountryId;
  const countriesVisited = parseCountriesVisited(o.countriesVisited);
  const visitPlacesByCountry = parseVisitPlacesByCountry(o.visitPlacesByCountry);
  let languageLevels = parseLanguageLevels(o.languageLevels);
  const natLang = countryPrimaryLang(homeCountryId);
  if (Object.keys(languageLevels).length === 0) {
    languageLevels = { [natLang]: "native" };
  }
  if (homeCountryId === "il") {
    languageLevels = {
      ...languageLevels,
      he: mergeLanguageLevel(languageLevels.he, "native"),
      en: mergeLanguageLevel(languageLevels.en, "knowledgeable"),
    };
  }

  const vExposure =
    residenceCountryId === RESIDENCE_NOMAD_ID
      ? homeCountryId
      : residenceCountryId;
  const rcnaRaw = o.regionalConflictNextEventAge;
  const regionalConflictNextEventAge =
    typeof rcnaRaw === "number" && Number.isFinite(rcnaRaw)
      ? clamp(Math.floor(rcnaRaw), 8, 120)
      : isRegionalConflictProneCountry(homeCountryId) ||
          isRegionalConflictProneCountry(vExposure)
        ? Math.min(95, Math.max(o.age + 1, 13))
        : 999;

  const flagsArr = o.flags as string[];
  let kidsCount =
    typeof o.kidsCount === "number" && Number.isFinite(o.kidsCount)
      ? clamp(Math.floor(o.kidsCount), 0, 20)
      : 0;
  let grandkidsCount =
    typeof o.grandkidsCount === "number" && Number.isFinite(o.grandkidsCount)
      ? clamp(Math.floor(o.grandkidsCount), 0, 30)
      : 0;
  if (kidsCount === 0 && flagsArr.includes("has_kids")) kidsCount = 1;
  if (grandkidsCount === 0 && flagsArr.includes("has_grandkids")) {
    grandkidsCount = 1;
  }

  const parsed: GameState = {
    characterName,
    avatar: normalizeAvatar(o.avatar),
    age: o.age,
    health: o.health,
    happiness: o.happiness,
    intelligence: clamp(intelligence, MIN_STAT, MAX_STAT),
    socialSkill: clamp(socialSkill, MIN_STAT, MAX_STAT),
    romanticSkill: clamp(romanticSkill, MIN_STAT, MAX_STAT),
    assets,
    debt,
    homeValue,
    homeLabel,
    flags: flagsArr,
    northStar,
    lifeLog,
    achievementIds,
    currentNodeId: o.currentNodeId,
    contentVersion: o.contentVersion,
    legacyFamilyHarmony,
    legacyRepute,
    legacyGenerosity,
    legacyHeirReadiness,
    lifetimeDonatedTotal,
    adultHeightInches,
    physiqueNature,
    heightInches: physiqueFinal.heightInches,
    weightLbs: physiqueFinal.weightLbs,
    homeCountryId,
    residenceCountryId,
    countriesVisited,
    visitPlacesByCountry,
    languageLevels,
    regionalConflictNextEventAge,
    kidsCount,
    grandkidsCount,
    gamePhase,
    ...(deathCause ? { deathCause } : {}),
    ...(avatarNice ? { avatarNice } : {}),
  };
  return clampMinorFinances(unlockAchievements(patchLegacyDefaults(parsed)));
}

export function getVisibleNode(
  state: GameState,
  locale: AppLocale = "en",
): LifeNode | undefined {
  const n = getNode(state.currentNodeId);
  if (!n) return undefined;
  return localizeLifeNode(n, locale);
}

export { getContent, getNode, CONTENT_VERSION };
