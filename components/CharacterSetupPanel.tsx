"use client";

import { useMemo, useState } from "react";
import type { Sex } from "react-nice-avatar";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import {
  niceConfigFromSetup,
  SETUP_HAIR_STYLE_COUNT,
  setupHairStyleShowsHairColor,
  type SetupShirtColor,
} from "@/lib/game/avatar-nice";
import { useLocale } from "@/lib/i18n/context";
import type { AvatarLook, CharacterSetupPayload } from "@/lib/game/types";
import {
  countryDisplayName,
  countryIdToFlagEmoji,
  HOME_COUNTRIES,
  languageDisplayName,
} from "@/lib/game/world";

type CharacterSetupPanelProps = {
  onBegin: (name: string, payload: CharacterSetupPayload) => void;
  disabled?: boolean;
  /** Tighter spacing when this is the only screen (no article chrome). */
  standalone?: boolean;
};

const PREVIEW_AGE = 8;

export function CharacterSetupPanel({
  onBegin,
  disabled,
  standalone = false,
}: CharacterSetupPanelProps) {
  const { t, locale } = useLocale();
  const [name, setName] = useState("");
  const [skinTone, setSkinTone] = useState(0);
  const [sex, setSex] = useState<Sex>("man");
  const [shirt, setShirt] = useState<SetupShirtColor>("blue");
  const [hairStyleSlot, setHairStyleSlot] = useState(0);
  const [hairColorSlot, setHairColorSlot] = useState(0);
  const [homeCountryId, setHomeCountryId] = useState("us");

  const avatarSlice = useMemo(
    (): AvatarLook => ({
      skinTone: skinTone % 4,
      hairStyle: hairStyleSlot,
      hairColor: hairColorSlot,
    }),
    [skinTone, hairStyleSlot, hairColorSlot],
  );

  const avatarNice = useMemo(
    () =>
      niceConfigFromSetup(avatarSlice, sex, {
        shirt,
      }),
    [avatarSlice, sex, shirt],
  );

  const hairColorApplies = setupHairStyleShowsHairColor(sex, hairStyleSlot);

  const hairColorOptions = [
    { value: 0, label: t("hair.black") },
    { value: 1, label: t("hair.brown") },
    { value: 2, label: t("hair.blonde") },
    { value: 3, label: t("hair.red") },
  ];

  const onPickSex = (v: Sex) => {
    setSex(v);
    setHairStyleSlot(0);
    setHairColorSlot(0);
    if (v === "woman") {
      setShirt("pink");
    } else {
      setShirt("blue");
    }
  };

  return (
    <div className={standalone ? "mt-6 space-y-6" : "mt-8 space-y-8"}>
      <div>
        <label
          htmlFor="char-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("char.nameLabel")}
        </label>
        <input
          id="char-name"
          type="text"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("char.namePlaceholder")}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none ring-violet-400/30 placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="char-home-country"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("char.homeCountry")}
        </label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t("char.homeCountryHint", {
            lang: languageDisplayName(
              HOME_COUNTRIES.find((c) => c.id === homeCountryId)?.primaryLang ??
                "en",
              locale,
            ),
          })}
        </p>
        <select
          id="char-home-country"
          value={homeCountryId}
          onChange={(e) => setHomeCountryId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {HOME_COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {countryDisplayName(c.id, locale)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t("char.lookPreview", { age: PREVIEW_AGE })}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3">
          <CharacterAvatar
            look={avatarSlice}
            avatarNice={avatarNice}
            age={PREVIEW_AGE}
            size={120}
          />
          <span
            className="select-none text-4xl leading-none drop-shadow-sm sm:text-5xl"
            title={countryDisplayName(homeCountryId, locale)}
            role="img"
            aria-label={`${countryDisplayName(homeCountryId, locale)} flag`}
          >
            {countryIdToFlagEmoji(homeCountryId)}
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          {t("char.previewHint")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OptionPickRow
            label={t("char.gender")}
            options={[
              { value: "woman", label: t("char.girl") },
              { value: "man", label: t("char.boy") },
            ]}
            current={sex}
            onPick={onPickSex}
          />
          <OptionRow
            label={t("char.skin")}
            count={4}
            value={skinTone}
            onChange={setSkinTone}
          />
          <OptionPickRow
            label={t("char.shirtColor")}
            options={[
              {
                value: "pink",
                label: t("shirt.pink"),
                swatchClass: "bg-pink-500",
              },
              {
                value: "blue",
                label: t("shirt.blue"),
                swatchClass: "bg-blue-600",
              },
              {
                value: "orange",
                label: t("shirt.orange"),
                swatchClass: "bg-orange-500",
              },
            ]}
            current={shirt}
            onPick={setShirt}
          />
        </div>

        <div className="mt-4 space-y-4">
          <OptionRow
            label={t("char.hairStyle")}
            count={SETUP_HAIR_STYLE_COUNT}
            value={hairStyleSlot}
            onChange={setHairStyleSlot}
          />
          {hairColorApplies ? (
            <OptionPickRow
              label={t("char.hairColor")}
              options={hairColorOptions}
              current={hairColorSlot}
              onPick={setHairColorSlot}
            />
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onBegin(name.trim() || t("char.defaultName"), {
            avatar: avatarSlice,
            avatarNice: niceConfigFromSetup(avatarSlice, sex, { shirt }),
            homeCountryId,
          });
        }}
        className="w-full rounded-full bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50"
      >
        {t("char.begin")}
      </button>
    </div>
  );
}

function OptionRow({
  label,
  count,
  value,
  onChange,
}: {
  label: string;
  count: number;
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`h-8 min-w-[2rem] rounded-lg border text-xs font-semibold tabular-nums transition ${
              value % count === i
                ? "border-violet-500 bg-violet-500 text-white"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-violet-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionPickRow<T extends string | number>({
  label,
  options,
  current,
  onPick,
}: {
  label: string;
  options: {
    value: T;
    label: string;
    swatchClass?: string;
  }[];
  current: T;
  onPick: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onPick(opt.value)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition ${
              current === opt.value
                ? "border-violet-500 bg-violet-500 text-white [&_.setup-swatch]:ring-white/50"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-violet-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {opt.swatchClass ? (
              <span
                className={`setup-swatch h-3.5 w-3.5 shrink-0 rounded-full ${opt.swatchClass}`}
                aria-hidden
              />
            ) : null}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
