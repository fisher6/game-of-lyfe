import type { AvatarFullConfig } from "react-nice-avatar";
import type { LanguageLevel } from "./world";

export type { LanguageLevel } from "./world";

export const CONTENT_VERSION = 17;

export type StatDelta = {
  health?: number;
  happiness?: number;
  /** Cash / net worth step (shown as Assets in UI). Legacy JSON key `money` still read by engine. */
  assets?: number;
  /** 0–100; curiosity, focus, long-term learning */
  intelligence?: number;
  /** 0–100; friends, presence, charm */
  socialSkill?: number;
  /** 0–100; dating, emotional fluency — often expensive in time & money */
  romanticSkill?: number;
  /** Loans / money owed (adds to debt when positive in delta). */
  debt?: number;
  ageDelta?: number;
  /** Legacy vitals (late life); clamped 0–100 in engine. */
  legacyFamilyHarmony?: number;
  legacyRepute?: number;
  legacyGenerosity?: number;
  legacyHeirReadiness?: number;
  /**
   * Adds to lifetime donated total and should pair with negative `assets` for real gifts.
   * Tracked for epilogue; not auto-subtracted from assets.
   */
  lifetimeDonatedDelta?: number;
  /** Height change in inches (fractions allowed; rounded to 0.1). */
  heightInches?: number;
  /** Weight change in pounds. */
  weightLbs?: number;
  /** Countries stamped on passport (ISO-ish ids, see `world.HOME_COUNTRIES`). */
  countriesVisitedAdd?: string[];
  /** Add “place” counts per country for immersion language rules. */
  visitPlacesAdd?: { countryId: string; places: number }[];
  /**
   * Set spoken languages (merged by rank: native > proficient > knowledgeable > basic).
   * Used for classes / study; immersion can also raise levels in the engine.
   */
  languageLevelsSet?: { code: string; level: LanguageLevel }[];
  /**
   * Where you live now (can differ from birth `homeCountryId`).
   * Use `"nomad"` for no fixed base, or `"@birth"` to reset to birth country.
   */
  setResidenceCountryId?: string;
  /** Add to number of children (clamped in engine). */
  kidsCountDelta?: number;
  /** Add to number of grandchildren (clamped in engine). */
  grandkidsCountDelta?: number;
};

export type HomeSnapshot = {
  /** Display e.g. market value of owned home; 0 if renting only */
  value: number;
  /** Short label: e.g. "Starter · ~$275k · mortgage" */
  label: string;
};

export type Choice = {
  id: string;
  label: string;
  /** null = end of run (show ending UI) */
  nextNodeId: string | null;
  /** If set, this choice only appears when `northStar` matches (e.g. creator-path beats). */
  showForNorthStar?: string;
  /** If set, hidden when `northStar` already equals this (e.g. hide “Switch: Athlete” when you’re already Athlete). */
  hideForNorthStar?: string;
  /** Hidden when birth country matches (e.g. hide “move to US” when already from the US). */
  hideIfHomeCountry?: string;
  /** Minimum net worth (assets − debt) required for this choice to appear. */
  minNetWorth?: number;
  /** Every id must be in `state.flags` (e.g. vacation return routing). */
  requiredFlags?: string[];
  /** Hidden if the player already has any of these flags (e.g. injury blocks athlete path). */
  hideIfAnyFlags?: string[];
  /** Shown only if birth or current residence is one of these country ids (see `world.HOME_COUNTRIES`). */
  showIfCountryIn?: string[];
  deltas?: StatDelta;
  flagsAdd?: string[];
  /** Sets/overwrites your long-term "north star" projection. */
  setNorthStar?: string;
  /** Owned home / renting summary after this choice */
  setHome?: HomeSnapshot;
};

export type OnEnterEffect = "parent_stipend";

export type LifeNode = {
  id: string;
  title?: string;
  body: string;
  onEnter?: StatDelta;
  /** Applied after `onEnter` delta (e.g. set housing when entering a year). */
  onEnterSetHome?: HomeSnapshot;
  /** Extra logic keyed by id (see engine). */
  onEnterEffects?: OnEnterEffect[];
  choices: Choice[];
};

/** Cosmetic only; clamped in engine (indices into palette arrays in UI). */
export type AvatarLook = {
  skinTone: number;
  hairColor: number;
  hairStyle: number;
};

/** Persisted react-nice-avatar options (result of `genConfig`). When set, UI uses Tier B illustrated avatar. */
export type StoredNiceAvatarConfig = Required<AvatarFullConfig>;

/** Character creation screen output (legacy indices + Tier B config). */
export type CharacterSetupPayload = {
  avatar: AvatarLook;
  avatarNice: StoredNiceAvatarConfig;
  /** Country id from `HOME_COUNTRIES` (e.g. `us`). */
  homeCountryId: string;
};

/** Last choices for a lightweight “story so far”. */
export type LifeLogEntry = {
  age: number;
  nodeId: string;
  nodeTitle: string;
  choiceLabel: string;
};

export type GamePhase = "living" | "dead";

export type GameState = {
  /** Display name; may be empty until character setup completes. */
  characterName: string;
  avatar: AvatarLook;
  /** Illustrated avatar (react-nice-avatar). Omit on older saves — legacy SVG uses `avatar` only. */
  avatarNice?: StoredNiceAvatarConfig;
  age: number;
  health: number;
  happiness: number;
  /** 0–100 */
  intelligence: number;
  /** 0–100 */
  socialSkill: number;
  /** 0–100 */
  romanticSkill: number;
  /** whole dollars — bank + holdings (liquid-ish); home value tracked separately */
  assets: number;
  /** Loans and money owed (display / achievements; ≥ 0). */
  debt: number;
  /** Estimated home value if you own; 0 if not */
  homeValue: number;
  /** Short description of housing situation */
  homeLabel: string;
  flags: string[];
  /** The user's current best-guess "what I'll be when I grow up" */
  northStar: string;
  /** Recent player choices (newest at end). */
  lifeLog: LifeLogEntry[];
  /** Unlocked achievement ids (see `achievements.ts`). */
  achievementIds: string[];
  currentNodeId: string;
  contentVersion: number;
  /** Late-life scores; meaningful from ~50+ in content. */
  legacyFamilyHarmony: number;
  legacyRepute: number;
  legacyGenerosity: number;
  legacyHeirReadiness: number;
  /** Running total of gifts/donations (dollars). */
  lifetimeDonatedTotal: number;
  /** Total height in inches (e.g. 50 at age 8, grows through teens). */
  heightInches: number;
  /** Weight in pounds. */
  weightLbs: number;
  /** Adult stature target (inches); growth curve interpolates from age 8 to 18. */
  adultHeightInches: number;
  /** -1…1-ish constitutional spread so BMI varies while staying mostly healthy. */
  physiqueNature: number;
  gamePhase: GamePhase;
  /** Set when `gamePhase` is dead (e.g. health exhaustion). */
  deathCause?: string;
  /** Birth country id — sets native language. */
  homeCountryId: string;
  /** Current country of residence, or `"nomad"` (no fixed base). Defaults to birth if unset in old saves. */
  residenceCountryId: string;
  /** Countries visited on trips (union; can include `homeCountryId`). */
  countriesVisited: string[];
  /** Cumulative “places” per country for immersion (see engine). */
  visitPlacesByCountry: Record<string, number>;
  /** Language code → highest level achieved. */
  languageLevels: Record<string, LanguageLevel>;
  /**
   * In-game age when a regional conflict “wave” may trigger for conflict-prone home/residence.
   * Non-prone countries use 999 (never).
   */
  regionalConflictNextEventAge: number;
  /** Children in household / story (incremented by midlife+ choices). */
  kidsCount: number;
  /** Grandchildren when story unlocks them (late-life choice). */
  grandkidsCount: number;
};

export type ContentBundle = {
  version: number;
  nodes: Record<string, LifeNode>;
};
