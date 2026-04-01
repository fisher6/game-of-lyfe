"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  applyAgeToNiceAvatar,
  greyBlendHairColor,
  niceAvatarVisualScale,
  SETUP_HAIR_COLOR_COUNT,
  SETUP_HAIR_COLOR_HEX,
  setupHairStyleToLegacySvgIndex,
  stubbleOpacityForMan,
} from "@/lib/game/avatar-nice";
import type {
  AvatarLook,
  StoredNiceAvatarConfig,
} from "@/lib/game/types";

const NiceAvatarLazy = dynamic(
  () => import("react-nice-avatar").then((m) => m.default),
  { ssr: false },
);

const SKIN = ["#F5D6CC", "#fde68a", "#cfa075", "#7c4a2d"] as const;
// Natural-ish palette: black → dark brown → brown → light brown → blonde → auburn → gray
const HAIR = [
  "#111827",
  "#2b1d13",
  "#4b2e1f",
  "#7b4f2a",
  "#d6b36a",
  "#a2452a",
  "#9ca3af",
] as const;

type CharacterAvatarProps = {
  look: AvatarLook;
  /** Tier B (react-nice-avatar). When set, age-based legacy proportions are skipped. */
  avatarNice?: StoredNiceAvatarConfig;
  age: number;
  /** Renders width/height in px */
  size?: number;
  className?: string;
};

/**
 * Character portrait: illustrated avatar (react-nice-avatar) when `avatarNice` is set,
 * otherwise legacy SVG whose proportions shift with life stage (kid → adult).
 */
export function CharacterAvatar({
  look,
  avatarNice,
  age,
  size = 88,
  className,
}: CharacterAvatarProps) {
  const agedNice = useMemo(
    () => (avatarNice ? applyAgeToNiceAvatar(avatarNice, age) : null),
    [avatarNice, age],
  );
  const visualScale = useMemo(() => niceAvatarVisualScale(age), [age]);
  const stubble = useMemo(
    () =>
      avatarNice?.sex === "man" ? stubbleOpacityForMan(age) : 0,
    [avatarNice?.sex, age],
  );

  if (agedNice) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <div
          className="flex h-full w-full items-end justify-center"
          style={{
            transform: `scale(${visualScale})`,
            transformOrigin: "bottom center",
          }}
        >
          <NiceAvatarLazy
            shape="rounded"
            style={{ width: size, height: size }}
            {...agedNice}
          />
        </div>
        {stubble > 0 ? (
          <StubbleLayer opacity={stubble} className="pointer-events-none absolute inset-0" />
        ) : null}
      </div>
    );
  }

  return (
    <LegacySvgPortrait look={look} age={age} size={size} className={className} />
  );
}

/** Light jaw / mustache hint; react-nice-avatar has no beard asset. */
function StubbleLayer({
  opacity,
  className,
}: {
  opacity: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 120"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <ellipse
        cx="50"
        cy="78"
        rx="17"
        ry="7"
        fill="#3d2f24"
        opacity={0.38 * opacity}
      />
      <path
        d="M 40 60 Q 50 64 60 60"
        stroke="#3d2f24"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.85 * opacity}
      />
      <path
        d="M 43 64 Q 50 67 57 64"
        stroke="#3d2f24"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity={0.55 * opacity}
      />
    </svg>
  );
}

function LegacySvgPortrait({
  look,
  age,
  size,
  className,
}: {
  look: AvatarLook;
  age: number;
  size: number;
  className?: string;
}) {
  const skin = SKIN[look.skinTone % SKIN.length];
  const hairBase =
    look.hairColor >= 0 && look.hairColor < SETUP_HAIR_COLOR_COUNT
      ? SETUP_HAIR_COLOR_HEX[look.hairColor]!
      : HAIR[look.hairColor % HAIR.length]!;
  const hair = greyBlendHairColor(hairBase, age);
  const style = setupHairStyleToLegacySvgIndex(look.hairStyle);
  const legacyScale = niceAvatarVisualScale(age);

  const stage = age <= 12 ? 0 : age <= 17 ? 1 : age <= 29 ? 2 : 3;
  const headR = [23, 22, 21, 20.5][stage];
  const headCy = [38, 38.5, 39, 39.5][stage];
  const shoulderW = [44, 48, 52, 56][stage];
  const shoulderY = [82, 84, 86, 88][stage];
  const eyeRy = [2.1, 2, 1.9, 1.85][stage];
  const smileR = [10, 11, 12, 12][stage];

  const hairCy = headCy - headR + 4;

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-end justify-center"
        style={{
          transform: `scale(${legacyScale})`,
          transformOrigin: "bottom center",
        }}
      >
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Shoulders / shirt */}
      <ellipse
        cx="50"
        cy={shoulderY}
        rx={shoulderW / 2}
        ry="14"
        className="fill-violet-200 dark:fill-violet-900/50"
      />
      <ellipse
        cx="50"
        cy={shoulderY + 2}
        rx={shoulderW / 2 - 6}
        ry="10"
        className="fill-violet-100 dark:fill-violet-950/60"
      />
      {/* Neck */}
      <rect
        x={50 - 7}
        y={headCy + headR - 4}
        width="14"
        height={10 + stage}
        rx="3"
        fill={skin}
      />
      {/* Head */}
      <circle cx="50" cy={headCy} r={headR} fill={skin} />
      {/* Hair */}
      {style === 0 ? (
        <>
          <ellipse cx="50" cy={hairCy} rx={headR + 3} ry="7" fill={hair} />
          <path
            d={`M ${50 - headR} ${headCy - 6} Q 50 ${headCy - headR - 1} ${
              50 + headR
            } ${headCy - 6}`}
            stroke={hair}
            strokeWidth="8"
            strokeLinecap="round"
            opacity={0.9}
          />
        </>
      ) : style === 1 ? (
        <>
          <ellipse cx="50" cy={hairCy + 1} rx={headR + 4} ry="9" fill={hair} />
          <path
            d={`M ${50 - headR + 6} ${headCy - headR + 6} Q ${50 - 2} ${
              headCy - headR + 14
            } ${50 + headR - 4} ${headCy - headR + 10}`}
            stroke="#f4f4f5"
            strokeWidth="1.2"
            opacity={0.25}
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx={50 + headR - 5}
            cy={headCy - 2}
            rx="6"
            ry="14"
            fill={hair}
            opacity={0.95}
          />
        </>
      ) : style === 2 ? (
        <>
          <ellipse cx="50" cy={hairCy + 2} rx={headR + 5} ry="11" fill={hair} />
          {Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={34 + i * 6}
              cy={headCy - headR + 12 + (i % 2) * 2}
              r="4"
              fill={hair}
              opacity={0.95}
            />
          ))}
          <ellipse cx="37" cy={headCy - 2} rx="6" ry="15" fill={hair} />
          <ellipse cx="63" cy={headCy - 2} rx="6" ry="15" fill={hair} />
        </>
      ) : style === 3 ? (
        <>
          <ellipse cx="50" cy={hairCy + 2} rx={headR + 5} ry="10" fill={hair} />
          <ellipse cx="34" cy={headCy - 1} rx="6" ry="15" fill={hair} />
          <ellipse cx="66" cy={headCy - 1} rx="6" ry="15" fill={hair} />
          <ellipse
            cx={50 + headR + 8}
            cy={headCy + 8}
            rx="8"
            ry="16"
            fill={hair}
            opacity={0.95}
          />
          <rect
            x={50 + headR + 1}
            y={headCy + 2}
            width="8"
            height="8"
            rx="3"
            fill={hair}
          />
        </>
      ) : style === 4 ? (
        <>
          <ellipse cx="50" cy={hairCy + 2} rx={headR + 5} ry="10" fill={hair} />
          <ellipse cx="34" cy={headCy - 1} rx="6" ry="15" fill={hair} />
          <ellipse cx="66" cy={headCy - 1} rx="6" ry="15" fill={hair} />
          <circle
            cx={50 + headR - 2}
            cy={headCy - headR + 4}
            r="8"
            fill={hair}
            opacity={0.98}
          />
        </>
      ) : (
        <>
          <ellipse cx="50" cy={hairCy + 2} rx={headR + 5} ry="10" fill={hair} />
          <ellipse cx="32" cy={headCy + 10} rx="8" ry="26" fill={hair} />
          <ellipse cx="68" cy={headCy + 10} rx="8" ry="26" fill={hair} />
          <path
            d={`M ${50 - 18} ${headCy - headR + 14} Q 50 ${
              headCy - headR + 22
            } ${50 + 18} ${headCy - headR + 14}`}
            stroke="#fff"
            strokeWidth="1.2"
            opacity={0.18}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {/* Eyes */}
      <ellipse cx="42" cy={headCy - 2} rx="3.2" ry={eyeRy} fill="#1f2937" />
      <ellipse cx="58" cy={headCy - 2} rx="3.2" ry={eyeRy} fill="#1f2937" />
      <ellipse
        cx="43"
        cy={headCy - 3}
        rx="1.1"
        ry="0.7"
        fill="#fff"
        opacity="0.85"
      />
      <ellipse
        cx="59"
        cy={headCy - 3}
        rx="1.1"
        ry="0.7"
        fill="#fff"
        opacity="0.85"
      />
      {stage <= 1 ? (
        <>
          <circle cx="36" cy={headCy + 6} r="4" fill="#f472b6" opacity="0.22" />
          <circle cx="64" cy={headCy + 6} r="4" fill="#f472b6" opacity="0.22" />
        </>
      ) : null}
      <path
        d={`M ${50 - smileR} ${headCy + 10} Q 50 ${headCy + 16 + stage} ${50 + smileR} ${headCy + 10}`}
        stroke="#1f2937"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
    </svg>
      </div>
    </div>
  );
}
