"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localizedAchievement } from "@/lib/i18n/achievement";
import type { AppLocale } from "@/lib/i18n/types";
import { interpolate, uiString } from "@/lib/i18n/ui";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  achievement: (id: string) => { title: string; description: string };
  numberLocale: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  /** English on every load; Hebrew applies only for the current session (not persisted). */
  const [locale, setLocaleState] = useState<AppLocale>("en");

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "he" ? "he" : "en";
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
  }, [locale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = uiString(locale, key) ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const achievement = useCallback(
    (id: string) => localizedAchievement(locale, id),
    [locale],
  );

  const numberLocale = locale === "he" ? "he-IL" : "en-US";

  const value = useMemo(
    () => ({ locale, setLocale, t, achievement, numberLocale }),
    [locale, setLocale, t, achievement, numberLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
