import { getAchievementMeta } from "@/lib/game/achievements";
import type { AppLocale } from "./types";
import { ACHIEVEMENT_HE } from "./achievement-he";

export function localizedAchievement(
  locale: AppLocale,
  id: string,
): { title: string; description: string } {
  if (locale === "he") {
    const he = ACHIEVEMENT_HE[id];
    if (he) return he;
  }
  return getAchievementMeta(id);
}
