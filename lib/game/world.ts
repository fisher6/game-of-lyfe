/** Home countries + languages for passport, vacations, and immersion. */

/** `knowledgeable`: strong passive / school exposure but not fluent (e.g. English in Israel). */
export type LanguageLevel =
  | "native"
  | "proficient"
  | "knowledgeable"
  | "basic";

export type CountryDef = {
  id: string;
  name: string;
  /** Primary language code for “native” at birth. */
  primaryLang: string;
};

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  hi: "Hindi",
  zh: "Mandarin Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  ru: "Russian",
  tr: "Turkish",
  sv: "Swedish",
  no: "Norwegian",
  el: "Greek",
  he: "Hebrew",
};

export const HOME_COUNTRIES: CountryDef[] = [
  { id: "us", name: "United States", primaryLang: "en" },
  { id: "ca", name: "Canada", primaryLang: "en" },
  { id: "mx", name: "Mexico", primaryLang: "es" },
  { id: "jm", name: "Jamaica", primaryLang: "en" },
  { id: "bs", name: "Bahamas", primaryLang: "en" },
  { id: "gb", name: "United Kingdom", primaryLang: "en" },
  { id: "ie", name: "Ireland", primaryLang: "en" },
  { id: "il", name: "Israel", primaryLang: "he" },
  { id: "fr", name: "France", primaryLang: "fr" },
  { id: "de", name: "Germany", primaryLang: "de" },
  { id: "es", name: "Spain", primaryLang: "es" },
  { id: "it", name: "Italy", primaryLang: "it" },
  { id: "pt", name: "Portugal", primaryLang: "pt" },
  { id: "nl", name: "Netherlands", primaryLang: "nl" },
  { id: "pl", name: "Poland", primaryLang: "pl" },
  { id: "in", name: "India", primaryLang: "hi" },
  { id: "cn", name: "China", primaryLang: "zh" },
  { id: "jp", name: "Japan", primaryLang: "ja" },
  { id: "kr", name: "South Korea", primaryLang: "ko" },
  { id: "au", name: "Australia", primaryLang: "en" },
  { id: "nz", name: "New Zealand", primaryLang: "en" },
  { id: "br", name: "Brazil", primaryLang: "pt" },
  { id: "ar", name: "Argentina", primaryLang: "es" },
  { id: "za", name: "South Africa", primaryLang: "en" },
  { id: "ng", name: "Nigeria", primaryLang: "en" },
  { id: "ph", name: "Philippines", primaryLang: "en" },
  { id: "eg", name: "Egypt", primaryLang: "ar" },
  { id: "se", name: "Sweden", primaryLang: "sv" },
  { id: "no", name: "Norway", primaryLang: "no" },
  { id: "gr", name: "Greece", primaryLang: "el" },
  { id: "tr", name: "Türkiye", primaryLang: "tr" },
  { id: "ru", name: "Russia", primaryLang: "ru" },
];

const COUNTRY_BY_ID = new Map(HOME_COUNTRIES.map((c) => [c.id, c]));

/** Birth or residence in these ids can see conflict pulses + military-service beats (content + engine). */
export const REGIONAL_CONFLICT_PRONE_COUNTRY_IDS = new Set(["il", "ru", "eg"]);

export function isRegionalConflictProneCountry(countryId: string): boolean {
  return REGIONAL_CONFLICT_PRONE_COUNTRY_IDS.has(
    countryId.trim().toLowerCase().slice(0, 8),
  );
}

export function getCountryDef(id: string): CountryDef | undefined {
  return COUNTRY_BY_ID.get(id);
}

export function countryDisplayName(id: string): string {
  return getCountryDef(id)?.name ?? id.toUpperCase();
}

/** ISO 3166-1 alpha-2 id (e.g. us, gb) → regional indicator flag emoji. */
export function countryIdToFlagEmoji(countryId: string): string {
  const id = countryId.trim().toLowerCase();
  if (id.length !== 2 || !/^[a-z]{2}$/.test(id)) return "\u26f3";
  const A = 0x1f1e6;
  const a = "a".charCodeAt(0);
  return String.fromCodePoint(
    A + (id.charCodeAt(0) - a),
    A + (id.charCodeAt(1) - a),
  );
}

/** Current residence: no fixed country (vans, hostels, short lets). */
export const RESIDENCE_NOMAD_ID = "nomad";

export function residenceDisplayLabel(residenceId: string): string {
  const id = residenceId.trim().toLowerCase();
  if (id === RESIDENCE_NOMAD_ID) return "Nomad";
  return countryDisplayName(id);
}

export function residenceFlagEmoji(residenceId: string): string {
  const id = residenceId.trim().toLowerCase();
  if (id === RESIDENCE_NOMAD_ID) return "\u{1f9f3}";
  return countryIdToFlagEmoji(id);
}

export function countryPrimaryLang(countryId: string): string {
  return getCountryDef(countryId)?.primaryLang ?? "en";
}

/** Language picked up from deep time in a country (immersion). */
export function countryImmersionLang(countryId: string): string {
  return countryPrimaryLang(countryId);
}

export function languageDisplayName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

const LEVEL_RANK: Record<LanguageLevel, number> = {
  native: 4,
  proficient: 3,
  knowledgeable: 2,
  basic: 1,
};

export function mergeLanguageLevel(
  current: LanguageLevel | undefined,
  incoming: LanguageLevel,
): LanguageLevel {
  if (!current) return incoming;
  return LEVEL_RANK[incoming] > LEVEL_RANK[current] ? incoming : current;
}

/** For immersion: if visits in one country exceed 5 places, earn at least basic; 12+ nudges toward proficient. */
export function immersionThresholdBasic(): number {
  return 6;
}

export function immersionThresholdProficient(): number {
  return 12;
}
