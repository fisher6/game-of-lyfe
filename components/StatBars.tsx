"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { useLocale } from "@/lib/i18n/context";
import {
  displayHomeLabel,
  displayNorthStar,
} from "@/lib/i18n/state-display-he";
import { computeBmi } from "@/lib/game/engine";
import { calendarYearForStoryAge } from "@/lib/game/story-calendar-year";
import type {
  AvatarLook,
  GameState,
  LanguageLevel,
  LifeLogEntry,
  StoredNiceAvatarConfig,
} from "@/lib/game/types";
import {
  countryDisplayName,
  residenceDisplayLabel,
  residenceFlagEmoji,
  languageDisplayName,
} from "@/lib/game/world";
import { LegacyTrackingPanel } from "@/components/LegacyTrackingPanel";
import type { AppLocale } from "@/lib/i18n/types";

const LEGACY_TRACKING_MIN_AGE = 65;

type StatBarsProps = {
  characterName: string;
  avatar: AvatarLook;
  avatarNice?: StoredNiceAvatarConfig;
  health: number;
  happiness: number;
  intelligence: number;
  socialSkill: number;
  romanticSkill: number;
  assets: number;
  debt: number;
  age: number;
  northStar: string;
  homeValue: number;
  homeLabel: string;
  lifeLog: LifeLogEntry[];
  achievementIds: string[];
  legacyFamilyHarmony: number;
  legacyRepute: number;
  legacyGenerosity: number;
  legacyHeirReadiness: number;
  lifetimeDonatedTotal: number;
  heightInches: number;
  weightLbs: number;
  homeCountryId: string;
  residenceCountryId: string;
  countriesVisited: string[];
  languageLevels: Record<string, LanguageLevel>;
  /** Story flags (partner / kids unlocks). */
  flags: string[];
  kidsCount: number;
  grandkidsCount: number;
  choicePanel?: ReactNode;
};

function formatHeightFtIn(inches: number): string {
  const total = Math.round(inches * 2) / 2;
  const ft = Math.floor(total / 12);
  const ins = total - ft * 12;
  const insLabel = Number.isInteger(ins) ? `${ins}` : ins.toFixed(1);
  return `${ft}'${insLabel}"`;
}

function formatHeightMetric(inches: number): string {
  const cm = Math.round(inches * 2.54);
  return `${cm} cm`;
}

function formatWeightMetric(lbs: number): string {
  const kg = Math.round((lbs / 2.20462262) * 10) / 10;
  return `${kg} kg`;
}

function formatDisplayHeight(
  inches: number,
  locale: AppLocale,
  t: (key: string) => string,
): string {
  if (locale === "he") {
    const m = inches * 0.0254;
    return `${m.toFixed(2)} ${t("life.unitMeter")}`;
  }
  return `${formatHeightFtIn(inches)} (${formatHeightMetric(inches)})`;
}

function formatDisplayWeight(
  lbs: number,
  locale: AppLocale,
  t: (key: string) => string,
): string {
  if (locale === "he") {
    const kg = lbs / 2.20462262;
    const rounded = Math.round(kg * 10) / 10;
    const str = Number.isInteger(rounded)
      ? `${rounded}`
      : rounded.toFixed(1);
    return `${str} ${t("life.unitKg")}`;
  }
  return `${lbs.toFixed(1)} ${t("life.lb")} (${formatWeightMetric(lbs)})`;
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "rose" | "amber" | "emerald" | "violet" | "cyan";
}) {
  const pct = Math.round((value / max) * 100);
  const bg =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "amber"
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

type LifePanelTab = "summary" | "achievements" | "recent";

export function StatBars({
  characterName,
  avatar,
  avatarNice,
  health,
  happiness,
  intelligence,
  socialSkill,
  romanticSkill,
  assets,
  debt,
  age,
  northStar,
  homeValue,
  homeLabel,
  lifeLog,
  achievementIds,
  legacyFamilyHarmony,
  legacyRepute,
  legacyGenerosity,
  legacyHeirReadiness,
  lifetimeDonatedTotal,
  heightInches,
  weightLbs,
  homeCountryId,
  residenceCountryId,
  countriesVisited,
  languageLevels,
  flags,
  kidsCount,
  grandkidsCount,
  choicePanel,
}: StatBarsProps) {
  const { t, achievement, numberLocale, locale } = useLocale();
  const [lifeTab, setLifeTab] = useState<LifePanelTab>("summary");
  const displayName = characterName.trim() || "…";
  const storyCalendarYear = calendarYearForStoryAge(age);

  function levelLabel(l: LanguageLevel): string {
    if (l === "native") return t("level.native");
    if (l === "proficient") return t("level.proficient");
    if (l === "knowledgeable") return t("level.knowledgeable");
    return t("level.basic");
  }
  const netWorth = assets - debt;
  const recentChoices = [...lifeLog].reverse().slice(0, 16);
  const physiqueRef = { heightInches, weightLbs, age } as GameState;
  const bmi = computeBmi(physiqueRef);

  const tabId = (t: LifePanelTab) => `life-tab-${t}`;
  const panelId = (t: LifePanelTab) => `life-panel-${t}`;

  const lifeTabBtn = (id: LifePanelTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={tabId(id)}
      aria-selected={lifeTab === id}
      aria-controls={panelId(id)}
      tabIndex={lifeTab === id ? 0 : -1}
      onClick={() => setLifeTab(id)}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 ${
        lifeTab === id
          ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500"
          : "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-700/80"
      }`}
    >
      {label}
    </button>
  );

  const summaryTwoColumn = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <div className="flex min-w-0 flex-col gap-3 sm:border-r sm:border-zinc-200/70 sm:pr-5 dark:sm:border-zinc-700/80">
        <div className="flex flex-col items-center border-b border-zinc-200/70 pb-3 dark:border-zinc-700/80 sm:items-start sm:border-b-0 sm:pb-0">
          <div className="flex items-center justify-center gap-1.5 sm:justify-start">
            <CharacterAvatar
              look={avatar}
              avatarNice={avatarNice}
              age={age}
              size={avatarNice ? 84 : 76}
            />
            <span
              className="select-none text-3xl leading-none drop-shadow-sm"
              title={residenceDisplayLabel(residenceCountryId, locale)}
              role="img"
              aria-label={t("life.flagAria", {
                place: residenceDisplayLabel(residenceCountryId, locale),
              })}
            >
              {residenceFlagEmoji(residenceCountryId)}
            </span>
          </div>
          <p className="mt-2 max-w-full truncate text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-left">
            {displayName}
          </p>
          {residenceCountryId !== homeCountryId ? (
            <p className="mt-1 max-w-full text-center text-[10px] text-zinc-500 dark:text-zinc-400 sm:text-left">
              {t("life.basedIn", {
                place: residenceDisplayLabel(residenceCountryId, locale),
              })}
            </p>
          ) : null}
        </div>
        <div
          className="grid max-w-[12rem] grid-cols-2 gap-x-4 gap-y-0.5"
          title={t("death.ageAndYearTitle")}
        >
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{t("life.age")}</p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {age}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{t("life.storyYear")}</p>
            <p
              className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
              aria-label={t("life.storyYearAria", { year: storyCalendarYear })}
            >
              {storyCalendarYear}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200/60 bg-zinc-50/40 px-2 py-1.5 dark:border-zinc-700/60 dark:bg-zinc-900/30">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {t("life.build")}
          </p>
          <dl className="mt-1 space-y-0.5 text-[11px] tabular-nums text-zinc-800 dark:text-zinc-200">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">{t("life.height")}</dt>
              <dd className="max-w-[68%] text-right font-medium leading-snug">
                {formatDisplayHeight(heightInches, locale, t)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">{t("life.weight")}</dt>
              <dd className="max-w-[68%] text-right font-medium leading-snug">
                {formatDisplayWeight(weightLbs, locale, t)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">{t("life.bmi")}</dt>
              <dd className="font-medium">{bmi.toFixed(1)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-[9px] leading-snug text-zinc-500 dark:text-zinc-400">
            {t("life.buildHint")}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{t("life.assets")}</p>
          <p className="truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            ${assets.toLocaleString(numberLocale)}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2.5 sm:gap-3">
        {debt > 0 ? (
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{t("life.debt")}</p>
            <p className="truncate text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              ${debt.toLocaleString(numberLocale)}
            </p>
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{t("life.netWorth")}</p>
          <p className="truncate text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
            ${netWorth.toLocaleString(numberLocale)}
          </p>
        </div>
        <div className="min-w-0 border-t border-zinc-200/70 pt-2 dark:border-zinc-700/80">
          <p className="text-xs text-zinc-500">{t("life.home")}</p>
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {displayHomeLabel(homeLabel, locale)}
          </p>
          {homeValue > 0 ? (
            <p className="mt-1 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
              {t("life.estValue", {
                v: homeValue.toLocaleString(numberLocale),
              })}
            </p>
          ) : null}
          {(flags.includes("has_partner") ||
            kidsCount > 0 ||
            grandkidsCount > 0 ||
            flags.includes("has_kids")) && (
            <dl className="mt-2 space-y-1 border-t border-zinc-200/60 pt-2 text-[10px] dark:border-zinc-700/60">
              {flags.includes("has_partner") ? (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-zinc-500">{t("life.partner")}</dt>
                  <dd className="text-right font-medium text-zinc-800 dark:text-zinc-200">
                    {t("life.married")}
                  </dd>
                </div>
              ) : null}
              {(kidsCount > 0 || flags.includes("has_kids")) &&
              !(flags.includes("no_kids") && kidsCount === 0) ? (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-zinc-500">{t("life.kids")}</dt>
                  <dd className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                    {kidsCount > 0 ? kidsCount : t("life.dash")}
                  </dd>
                </div>
              ) : null}
              {grandkidsCount > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-zinc-500">
                    {t("life.grandkids")}
                  </dt>
                  <dd className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                    {grandkidsCount}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            {t("life.projected")}
          </p>
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {displayNorthStar(northStar, locale)}
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-sky-200/70 bg-sky-50/40 px-2 py-1.5 dark:border-sky-900/40 dark:bg-sky-950/25">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {t("life.from")}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {countryDisplayName(homeCountryId, locale)}
          </p>
        </div>
      </div>
    </div>
  );

  const achievementsPanel = (
    <div className="max-h-[min(24rem,50vh)] space-y-4 overflow-y-auto pr-1 sm:max-h-[min(28rem,55vh)]">
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          {t("life.passport")}
        </p>
        {countriesVisited.length === 0 ? (
          <p className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            {t("life.passportEmpty")}
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {[...countriesVisited].sort().map((cid) => (
              <li
                key={cid}
                className="rounded-md border border-emerald-200/80 bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-zinc-900/60 dark:text-emerald-100"
              >
                {countryDisplayName(cid, locale)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="border-t border-zinc-200/70 pt-3 dark:border-zinc-700/80">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
          {t("life.languages")}
        </p>
        <ul className="mt-1.5 space-y-1 text-[10px] text-zinc-700 dark:text-zinc-300">
          {Object.entries(languageLevels)
            .sort(([a], [b]) =>
              languageDisplayName(a, locale).localeCompare(
                languageDisplayName(b, locale),
                locale === "he" ? "he" : "en",
              ),
            )
            .map(([code, lvl]) => (
              <li key={code} className="leading-snug">
                <span className="font-medium text-indigo-900 dark:text-indigo-100">
                  {languageDisplayName(code, locale)}
                </span>
                <span className="text-zinc-500"> · </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {levelLabel(lvl)}
                </span>
              </li>
            ))}
        </ul>
      </section>
      <section className="border-t border-zinc-200/70 pt-3 dark:border-zinc-700/80">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          {t("life.unlockedFull", {
            a: achievementIds.length,
            b: ACHIEVEMENTS.length,
          })}
        </p>
        {achievementIds.length === 0 ? (
          <p className="mt-1.5 text-[10px] text-zinc-400">
            {t("life.playUnlock")}
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1 text-[10px] text-zinc-700 dark:text-zinc-300">
            {achievementIds.map((id) => (
              <li key={id} className="leading-snug">
                <span className="font-medium text-violet-800 dark:text-violet-200">
                  {achievement(id).title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const recentPanel = (
    <div className="max-h-[min(24rem,50vh)] overflow-y-auto pr-1 sm:max-h-[min(28rem,55vh)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {t("life.recentLogTitle", { n: lifeLog.length })}
      </p>
      {recentChoices.length === 0 ? (
        <p className="mt-2 text-[10px] text-zinc-400">{t("life.recentEmpty")}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
          {recentChoices.map((e, i) => (
            <li key={`${e.nodeId}-${e.age}-${i}`}>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {t("life.recentAge", { age: e.age })}
              </span>
              {e.nodeTitle ? (
                <span className="block text-[9px] text-zinc-500">
                  {e.nodeTitle}
                </span>
              ) : null}
              <span className="block text-zinc-600 dark:text-zinc-400">
                {e.choiceLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="w-full min-w-0 rounded-2xl border border-zinc-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("life.panel")}
          </p>
          <div
            className="flex flex-wrap gap-1"
            role="tablist"
            aria-label={t("life.ariaTabs")}
          >
            {lifeTabBtn("summary", t("life.tab.summary"))}
            {lifeTabBtn("achievements", t("life.tab.achievements"))}
            {lifeTabBtn("recent", t("life.tab.recent"))}
          </div>
        </div>

        <div
          role="tabpanel"
          id={panelId("summary")}
          aria-labelledby={tabId("summary")}
          hidden={lifeTab !== "summary"}
          className={lifeTab === "summary" ? undefined : "hidden"}
        >
          {summaryTwoColumn}
        </div>
        <div
          role="tabpanel"
          id={panelId("achievements")}
          aria-labelledby={tabId("achievements")}
          hidden={lifeTab !== "achievements"}
          className={lifeTab === "achievements" ? undefined : "hidden"}
        >
          {achievementsPanel}
        </div>
        <div
          role="tabpanel"
          id={panelId("recent")}
          aria-labelledby={tabId("recent")}
          hidden={lifeTab !== "recent"}
          className={lifeTab === "recent" ? undefined : "hidden"}
        >
          {recentPanel}
        </div>
      </div>

      <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 sm:flex-row sm:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5">
          <p className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("life.vitals")}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <Bar label={t("stat.health")} value={health} max={100} tone="emerald" />
            <Bar
              label={t("stat.happiness")}
              value={happiness}
              max={100}
              tone="amber"
            />
            <Bar
              label={t("stat.intelligence")}
              value={intelligence}
              max={100}
              tone="violet"
            />
            <Bar label={t("stat.social")} value={socialSkill} max={100} tone="cyan" />
            <Bar
              label={t("stat.romantic")}
              value={romanticSkill}
              max={100}
              tone="rose"
            />
          </div>
          {age >= LEGACY_TRACKING_MIN_AGE ? (
            <LegacyTrackingPanel
              legacyFamilyHarmony={legacyFamilyHarmony}
              legacyRepute={legacyRepute}
              legacyGenerosity={legacyGenerosity}
              legacyHeirReadiness={legacyHeirReadiness}
              lifetimeDonatedTotal={lifetimeDonatedTotal}
            />
          ) : null}
        </div>
        <div className="flex min-h-0 w-full shrink-0 flex-col border-t border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-700/80 dark:bg-zinc-900/40 sm:w-44 sm:max-w-[11rem] sm:border-l sm:border-t-0">
          <p className="shrink-0 border-b border-zinc-200/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700/60">
            {t("life.lastChange")}
          </p>
          <div className="flex min-h-[10rem] flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 sm:min-h-0">
            {choicePanel}
          </div>
        </div>
      </div>
    </div>
  );
}
