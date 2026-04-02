import type { AppLocale } from "@/lib/i18n/types";
import type { Choice, LifeNode } from "@/lib/game/types";
import storyHe from "@/content/story-he.json";

const STORY_HE = storyHe as Record<string, string>;

function he(key: string): string | undefined {
  return STORY_HE[key];
}

/** Localized copy for UI (canonical `node` from getNode stays English for logic). */
export function localizeLifeNode(node: LifeNode, locale: AppLocale): LifeNode {
  if (locale !== "he") return node;
  const titleKey = `${node.id}__title`;
  const bodyKey = `${node.id}__body`;
  const t = he(titleKey);
  const b = he(bodyKey);
  const choices: Choice[] = node.choices.map((c) => {
    const lk = `${node.id}__${c.id}`;
    const label = he(lk) ?? c.label;
    return { ...c, label };
  });
  return {
    ...node,
    title: t !== undefined ? t : node.title,
    body: b ?? node.body,
    choices,
  };
}

/** Choice label for life log when playing in Hebrew. */
export function localizedChoiceLabel(
  nodeId: string,
  choiceId: string,
  fallback: string,
  locale: AppLocale,
): string {
  if (locale !== "he") return fallback;
  return he(`${nodeId}__${choiceId}`) ?? fallback;
}

export function localizedNodeTitleForLog(
  nodeId: string,
  title: string | undefined,
  fallbackId: string,
  locale: AppLocale,
): string {
  const base = title ?? fallbackId;
  if (locale !== "he") return base;
  const t = he(`${nodeId}__title`);
  return t !== undefined ? t : base;
}

export type SyntheticLogKey =
  | "regional_conflict"
  | "military_rehab"
  | "military_injury";

export function syntheticLifeLogStrings(
  key: SyntheticLogKey,
  locale: AppLocale,
): { nodeTitle: string; choiceLabel: string } {
  if (locale !== "he") {
    if (key === "regional_conflict") {
      return {
        nodeTitle: "Regional conflict",
        choiceLabel:
          "War, riots, or occupation fear surges where you're living — stress you never signed up for.",
      };
    }
    if (key === "military_rehab") {
      return {
        nodeTitle: "Rehab and adjustment",
        choiceLabel:
          "Body and mood climb back — not the same as before, but you're still here.",
      };
    }
    return {
      nodeTitle: "Service injury",
      choiceLabel:
        "Serious injury in service — rehab, trauma, pro-sports dreams out of reach.",
    };
  }
  if (key === "regional_conflict") {
    return {
      nodeTitle: he("synthetic__regional_conflict__title") ?? "Regional conflict",
      choiceLabel:
        he("synthetic__regional_conflict__body") ??
        "War, riots, or occupation fear surges where you're living — stress you never signed up for.",
    };
  }
  if (key === "military_rehab") {
    return {
      nodeTitle: he("synthetic__military_rehab__title") ?? "Rehab and adjustment",
      choiceLabel:
        he("synthetic__military_rehab__body") ??
        "Body and mood climb back — not the same as before, but you're still here.",
    };
  }
  return {
    nodeTitle: he("synthetic__military_injury__title") ?? "Service injury",
    choiceLabel:
      he("synthetic__military_injury__body") ??
      "Serious injury in service — rehab, trauma, pro-sports dreams out of reach.",
  };
}
