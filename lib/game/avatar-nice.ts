import type {
  AvatarFullConfig,
  EarSize,
  HairStyle,
  Sex,
} from "react-nice-avatar";
import type { AvatarLook, StoredNiceAvatarConfig } from "@/lib/game/types";

/** Tone 0 = fair / light (default); then warmer and deeper. */
const FACE = ["#F5D6CC", "#fde68a", "#cfa075", "#7c4a2d"] as const;
const HAIR = [
  "#111827",
  "#2b1d13",
  "#4b2e1f",
  "#7b4f2a",
  "#d6b36a",
  "#a2452a",
  "#9ca3af",
] as const;

/** T-shirt colors for character setup (boy / girl). */
export const SETUP_SHIRT = {
  pink: "#ec4899",
  blue: "#2563eb",
  orange: "#ea580c",
} as const;
export type SetupShirtColor = keyof typeof SETUP_SHIRT;

/** Legacy / internal: three library cuts per sex × old color count (engine, labels). */
export const SETUP_HAIR_STYLE_SLOTS = 3;
export const SETUP_HAIR_COLOR_SLOTS = HAIR.length;
export const SETUP_HAIR_PRESET_COUNT =
  SETUP_HAIR_STYLE_SLOTS * SETUP_HAIR_COLOR_SLOTS;

/** Numbered hair styles in the creator (three cuts + beanie + turban + glasses). */
export const SETUP_HAIR_STYLE_COUNT = 6;

/** Creator palette: black, brown, blonde, ginger (maps to `AvatarLook.hairColor` 0–3). */
export const SETUP_HAIR_COLOR_LABELS = [
  "Black",
  "Brown",
  "Blonde",
  "Ginger",
] as const;
export const SETUP_HAIR_COLOR_COUNT = SETUP_HAIR_COLOR_LABELS.length;

export const SETUP_HAIR_COLOR_HEX = [
  "#111827",
  "#4b2e1f",
  "#d6b36a",
  "#a2452a",
] as const;

type SetupStyleParts = {
  hairStyle: HairStyle;
  hatStyle: NonNullable<AvatarFullConfig["hatStyle"]>;
  glassesStyle?: NonNullable<AvatarFullConfig["glassesStyle"]>;
};

const MAN_SETUP_STYLES: SetupStyleParts[] = [
  { hairStyle: "normal", hatStyle: "none" },
  { hairStyle: "thick", hatStyle: "none" },
  { hairStyle: "mohawk", hatStyle: "none" },
  { hairStyle: "normal", hatStyle: "beanie" },
  { hairStyle: "normal", hatStyle: "turban" },
  { hairStyle: "mohawk", hatStyle: "none", glassesStyle: "round" },
];

const WOMAN_SETUP_STYLES: SetupStyleParts[] = [
  { hairStyle: "normal", hatStyle: "none" },
  { hairStyle: "womanLong", hatStyle: "none" },
  { hairStyle: "womanShort", hatStyle: "none" },
  { hairStyle: "normal", hatStyle: "beanie" },
  { hairStyle: "normal", hatStyle: "turban" },
  { hairStyle: "womanLong", hatStyle: "none", glassesStyle: "round" },
];

/** Maps setup `hairStyle` index to legacy SVG portrait shape (6 drawings). */
const SETUP_TO_LEGACY_SVG_STYLE = [0, 1, 2, 3, 4, 2] as const;

export function getSetupStyleParts(sex: Sex, styleIdx: number): SetupStyleParts {
  const i = Math.max(
    0,
    Math.min(SETUP_HAIR_STYLE_COUNT - 1, Math.floor(styleIdx)),
  );
  return sex === "man" ? MAN_SETUP_STYLES[i]! : WOMAN_SETUP_STYLES[i]!;
}

export function setupHairStyleToLegacySvgIndex(hairStyle: number): number {
  const i = Math.max(
    0,
    Math.min(SETUP_HAIR_STYLE_COUNT - 1, Math.floor(hairStyle)),
  );
  return SETUP_TO_LEGACY_SVG_STYLE[i] ?? 0;
}

/** Whether the nice-avatar hair layer is visible enough for the setup hair-color control. */
export function setupHairStyleShowsHairColor(sex: Sex, styleIdx: number): boolean {
  return getSetupStyleParts(sex, styleIdx).hatStyle === "none";
}

const SETUP_COLOR_NAMES = [
  "Black",
  "Dk brown",
  "Brown",
  "Lt brown",
  "Blonde",
  "Auburn",
  "Silver",
] as const;

const MAN_CUT_NAMES = ["Short", "Thick", "Mohawk"] as const;
const WOMAN_CUT_NAMES = ["Neat", "Long", "Bob"] as const;

/** UI label for linear hair preset index (same encoding as `AvatarLook` style/color). */
export function getSetupHairPresetLabel(
  sex: Sex,
  presetIdx: number,
): string {
  const s =
    Math.floor(presetIdx / SETUP_HAIR_COLOR_SLOTS) % SETUP_HAIR_STYLE_SLOTS;
  const c = presetIdx % SETUP_HAIR_COLOR_SLOTS;
  const cut = sex === "man" ? MAN_CUT_NAMES[s] : WOMAN_CUT_NAMES[s];
  const tone = SETUP_COLOR_NAMES[c] ?? `Color ${c}`;
  return `${cut} · ${tone}`;
}

const MAN_HAIR: readonly HairStyle[] = ["normal", "thick", "mohawk"];
const WOMAN_HAIR: readonly HairStyle[] = [
  "normal",
  "womanLong",
  "womanShort",
];

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** Defaults matching `genConfig({})` shape so we never import `react-nice-avatar` on the server bundle. */
const NICE_TEMPLATE: StoredNiceAvatarConfig = {
  sex: "woman",
  faceColor: "#F9C9B6",
  earSize: "small",
  hairColor: "#000",
  hairStyle: "normal",
  /** Library quirk: thick/mohawk SVGs only apply `hairColor` when this is true (they use `colorRandom && color`). */
  hairColorRandom: true,
  hatColor: "#000",
  hatStyle: "none",
  eyeStyle: "circle",
  glassesStyle: "none",
  noseStyle: "short",
  mouthStyle: "smile",
  shirtStyle: "hoody",
  shirtColor: "#9287FF",
  bgColor: "#E0DDFF",
  isGradient: false,
  eyeBrowStyle: "upWoman",
};

const EAR: readonly EarSize[] = ["small", "big"];
const HAT: readonly NonNullable<AvatarFullConfig["hatStyle"]>[] = [
  "beanie",
  "turban",
  "none",
];
const EYE: readonly NonNullable<AvatarFullConfig["eyeStyle"]>[] = [
  "circle",
  "oval",
  "smile",
];
const GLASSES: readonly NonNullable<AvatarFullConfig["glassesStyle"]>[] = [
  "round",
  "square",
  "none",
];
const NOSE: readonly NonNullable<AvatarFullConfig["noseStyle"]>[] = [
  "short",
  "long",
  "round",
];
const MOUTH: readonly NonNullable<AvatarFullConfig["mouthStyle"]>[] = [
  "laugh",
  "smile",
  "peace",
];
const SHIRT: readonly NonNullable<AvatarFullConfig["shirtStyle"]>[] = [
  "hoody",
  "short",
  "polo",
];
const BROW: readonly NonNullable<AvatarFullConfig["eyeBrowStyle"]>[] = [
  "up",
  "upWoman",
];

const ALL_HAIR: readonly HairStyle[] = [
  "normal",
  "thick",
  "mohawk",
  "womanLong",
  "womanShort",
];

function pickHairStyle(sex: Sex, hairStyleIdx: number): HairStyle {
  const list = sex === "man" ? MAN_HAIR : WOMAN_HAIR;
  return list[hairStyleIdx % list.length]!;
}

function coerceHairForSex(sex: Sex, hairStyle: HairStyle): HairStyle {
  if (sex === "man") {
    if (hairStyle === "womanLong" || hairStyle === "womanShort") return "normal";
    if (MAN_HAIR.includes(hairStyle as (typeof MAN_HAIR)[number])) return hairStyle;
    return "normal";
  }
  if (hairStyle === "thick" || hairStyle === "mohawk") return "normal";
  if (WOMAN_HAIR.includes(hairStyle as (typeof WOMAN_HAIR)[number])) return hairStyle;
  return "normal";
}

function isSex(v: unknown): v is Sex {
  return v === "man" || v === "woman";
}

/** Build a full Tier B config from legacy indices + sex (older saves / fallback). */
export function niceConfigFromLegacy(
  look: AvatarLook,
  sex: Sex,
): StoredNiceAvatarConfig {
  const hairStyle = pickHairStyle(sex, look.hairStyle);
  return {
    ...NICE_TEMPLATE,
    sex,
    faceColor: FACE[look.skinTone % FACE.length],
    hairColor: HAIR[look.hairColor % HAIR.length],
    hairColorRandom: true,
    hairStyle,
    hatStyle: "none",
    glassesStyle: "none",
    eyeBrowStyle: sex === "woman" ? "upWoman" : "up",
  };
}

/** Character creator: T-shirt + `look.hairStyle` (0–5) + `look.hairColor` (0–3 setup colors). */
export function niceConfigFromSetup(
  look: AvatarLook,
  sex: Sex,
  opts: { shirt: SetupShirtColor },
): StoredNiceAvatarConfig {
  const shirtColor = SETUP_SHIRT[opts.shirt];
  const faceColor = FACE[look.skinTone % FACE.length];
  const parts = getSetupStyleParts(sex, look.hairStyle);
  const hairColorHex =
    look.hairColor >= 0 && look.hairColor < SETUP_HAIR_COLOR_HEX.length
      ? SETUP_HAIR_COLOR_HEX[look.hairColor]!
      : HAIR[Math.max(0, look.hairColor) % HAIR.length]!;

  if (sex === "man") {
    return {
      ...NICE_TEMPLATE,
      sex: "man",
      faceColor,
      hairColor: hairColorHex,
      hairStyle: parts.hairStyle,
      shirtStyle: "short",
      shirtColor,
      hatStyle: parts.hatStyle,
      glassesStyle: parts.glassesStyle ?? "none",
      eyeStyle: "oval",
      noseStyle: "round",
      mouthStyle: "peace",
      eyeBrowStyle: "up",
      earSize: "small",
    };
  }

  return {
    ...NICE_TEMPLATE,
    sex: "woman",
    faceColor,
    hairColor: hairColorHex,
    hairColorRandom: true,
    hairStyle: parts.hairStyle,
    shirtStyle: "short",
    shirtColor,
    hatStyle: parts.hatStyle,
    glassesStyle: parts.glassesStyle ?? "none",
    eyeBrowStyle: "upWoman",
  };
}

const HAIR_GREY = "#b6b6b6";

function lerpHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace("#", "").trim();
    const n = parseInt(s.length === 6 ? s : "000000", 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const A = parse(from);
  const B = parse(to);
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(A.r + (B.r - A.r) * k);
  const g = Math.round(A.g + (B.g - A.g) * k);
  const b = Math.round(A.b + (B.b - A.b) * k);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Legacy SVG portrait hair: same grey ramp as nice-avatar (40+). */
export function greyBlendHairColor(baseHex: string, age: number): string {
  const greyT = Math.max(0, Math.min(1, (age - 40) / 30));
  if (greyT <= 0 || !HEX6.test(baseHex)) return baseHex;
  return lerpHex(baseHex, HAIR_GREY, greyT * 0.92);
}

/**
 * Subtle scale so kids read smaller; adults full size; very old slightly shrunken.
 * Applied in UI via CSS `transform` (does not change saved config).
 */
export function niceAvatarVisualScale(age: number): number {
  const a = Math.max(5, age);
  if (a <= 8) return 0.86;
  if (a < 21) return 0.86 + (0.14 * (a - 8)) / 13;
  if (a < 62) return 1;
  if (a < 80) return 1 - (0.035 * (a - 62)) / 18;
  return 0.965;
}

/** Facial-hair hint for men (library has no beard); 0–1 opacity for a light overlay. */
export function stubbleOpacityForMan(age: number): number {
  if (age < 14) return 0;
  if (age < 20) return 0.1 + ((age - 14) / 6) * 0.35;
  if (age < 48) return 0.48;
  return Math.max(0.22, 0.48 - (age - 48) * 0.007);
}

/**
 * Age-staged face on top of saved `avatarNice`: child → teen → adult features, grey from ~40+.
 * Pure function; call only when rendering (never persist this output).
 */
export function applyAgeToNiceAvatar(
  base: StoredNiceAvatarConfig,
  age: number,
): StoredNiceAvatarConfig {
  const sex = base.sex;
  const a = Math.max(5, age);

  const greyT = Math.max(0, Math.min(1, (a - 40) / 30));
  const hairColor =
    greyT > 0 && HEX6.test(base.hairColor)
      ? lerpHex(base.hairColor, HAIR_GREY, greyT * 0.92)
      : base.hairColor;

  const isChild = a < 13;
  const isTeen = a >= 13 && a < 18;

  let mouthStyle = base.mouthStyle;
  let eyeStyle = base.eyeStyle;
  let noseStyle = base.noseStyle;
  let earSize = base.earSize;
  let hairStyle = base.hairStyle;

  if (sex === "woman") {
    hairStyle = base.hairStyle;
    if (isChild) {
      mouthStyle = "smile";
      eyeStyle = "circle";
      noseStyle = "short";
      earSize = "small";
    } else if (isTeen) {
      mouthStyle = "peace";
      eyeStyle = "oval";
      noseStyle = "round";
      earSize = "small";
    } else {
      mouthStyle = "peace";
      eyeStyle = "oval";
      noseStyle = a >= 32 ? "long" : "round";
      earSize = a >= 47 ? "big" : "small";
    }
  } else {
    const boyHair =
      (base.hairStyle === "normal" ||
        base.hairStyle === "thick" ||
        base.hairStyle === "mohawk") &&
      base.hairStyle;
    if (isChild) {
      hairStyle = boyHair || "normal";
      mouthStyle = "peace";
      eyeStyle = "oval";
      noseStyle = "round";
      earSize = "small";
    } else if (isTeen) {
      hairStyle = boyHair ? base.hairStyle : a >= 14 ? "thick" : "normal";
      mouthStyle = "peace";
      eyeStyle = "oval";
      noseStyle = "round";
      earSize = "small";
    } else {
      hairStyle =
        base.hairStyle === "mohawk"
          ? "mohawk"
          : a < 52
            ? "thick"
            : "normal";
      mouthStyle = a >= 23 ? "laugh" : "peace";
      eyeStyle = "oval";
      noseStyle = "long";
      earSize = a >= 47 ? "big" : "small";
    }
  }

  return {
    ...base,
    hairColor,
    mouthStyle,
    eyeStyle,
    noseStyle,
    earSize,
    hairStyle,
  };
}

/** Restore `avatarNice` from saved JSON; invalid or absent → undefined (fallback to legacy SVG). */
export function normalizeNiceAvatar(
  raw: unknown,
): StoredNiceAvatarConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (!isSex(o.sex)) return undefined;

  const sex = o.sex;
  const next: StoredNiceAvatarConfig = { ...NICE_TEMPLATE, sex };

  if (typeof o.faceColor === "string" && HEX6.test(o.faceColor)) {
    next.faceColor = o.faceColor;
  }
  if (typeof o.hairColor === "string" && HEX6.test(o.hairColor)) {
    next.hairColor = o.hairColor;
  }
  if (typeof o.shirtColor === "string" && HEX6.test(o.shirtColor)) {
    next.shirtColor = o.shirtColor;
  }
  if (typeof o.hatColor === "string" && HEX6.test(o.hatColor)) {
    next.hatColor = o.hatColor;
  }
  if (typeof o.bgColor === "string" && HEX6.test(o.bgColor)) {
    next.bgColor = o.bgColor;
  }

  if (typeof o.earSize === "string" && (EAR as readonly string[]).includes(o.earSize)) {
    next.earSize = o.earSize as EarSize;
  }
  if (typeof o.hatStyle === "string" && (HAT as readonly string[]).includes(o.hatStyle)) {
    next.hatStyle = o.hatStyle as NonNullable<AvatarFullConfig["hatStyle"]>;
  }
  if (typeof o.eyeStyle === "string" && (EYE as readonly string[]).includes(o.eyeStyle)) {
    next.eyeStyle = o.eyeStyle as NonNullable<AvatarFullConfig["eyeStyle"]>;
  }
  if (
    typeof o.glassesStyle === "string" &&
    (GLASSES as readonly string[]).includes(o.glassesStyle)
  ) {
    next.glassesStyle = o.glassesStyle as NonNullable<
      AvatarFullConfig["glassesStyle"]
    >;
  }
  if (typeof o.noseStyle === "string" && (NOSE as readonly string[]).includes(o.noseStyle)) {
    next.noseStyle = o.noseStyle as NonNullable<AvatarFullConfig["noseStyle"]>;
  }
  if (typeof o.mouthStyle === "string" && (MOUTH as readonly string[]).includes(o.mouthStyle)) {
    next.mouthStyle = o.mouthStyle as NonNullable<AvatarFullConfig["mouthStyle"]>;
  }
  if (typeof o.shirtStyle === "string" && (SHIRT as readonly string[]).includes(o.shirtStyle)) {
    next.shirtStyle = o.shirtStyle as NonNullable<AvatarFullConfig["shirtStyle"]>;
  }
  if (
    typeof o.eyeBrowStyle === "string" &&
    (BROW as readonly string[]).includes(o.eyeBrowStyle)
  ) {
    next.eyeBrowStyle = o.eyeBrowStyle as NonNullable<
      AvatarFullConfig["eyeBrowStyle"]
    >;
  }
  if (typeof o.hairStyle === "string" && (ALL_HAIR as readonly string[]).includes(o.hairStyle)) {
    next.hairStyle = coerceHairForSex(sex, o.hairStyle as HairStyle);
  } else {
    next.hairStyle = coerceHairForSex(sex, next.hairStyle);
  }

  next.hairColorRandom = true;
  if (o.isGradient === true || o.isGradient === false) {
    next.isGradient = o.isGradient;
  }

  if (sex === "man") next.eyeBrowStyle = "up";

  return next;
}
