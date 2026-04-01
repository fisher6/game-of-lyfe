import type { GameState } from "./types";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  test: (s: GameState) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "story_begins",
    title: "First step",
    description: "Made your first real choice after the prologue.",
    test: (s) => s.lifeLog.length >= 1,
  },
  {
    id: "teen",
    title: "Teen years",
    description: "Turned 13 — awkward and loud.",
    test: (s) => s.age >= 13,
  },
  {
    id: "adult",
    title: "Legal adult",
    description: "Turned 18 — more paperwork, same feelings.",
    test: (s) => s.age >= 18,
  },
  {
    id: "twenty_something",
    title: "Roaring twenties",
    description: "Hit age 20 while the world still feels temporary.",
    test: (s) => s.age >= 20,
  },
  {
    id: "renter_life",
    title: "Lease life",
    description: "Living away from your parents' roof.",
    test: (s) =>
      /renting|dorm|lease|away from parents/i.test(s.homeLabel) &&
      !/parents'? house/i.test(s.homeLabel),
  },
  {
    id: "homeowner",
    title: "Deed in the drawer",
    description: "Own a place with a non-zero home value.",
    test: (s) => s.homeValue > 0,
  },
  {
    id: "in_debt",
    title: "Owe somebody",
    description: "Carrying at least $5k in loans or IOUs.",
    test: (s) => s.debt >= 5000,
  },
  {
    id: "comfortable",
    title: "Cushion",
    description: "More than $25k in assets and less than $15k in debt.",
    test: (s) => s.assets >= 25_000 && s.debt < 15_000,
  },
  {
    id: "college_bound",
    title: "Campus energy",
    description: "Chose the college path.",
    test: (s) => s.flags.includes("chose_college"),
  },
  {
    id: "creator_dream",
    title: "For You, forever",
    description: "Committed to the social creator north star.",
    test: (s) => s.northStar === "Social media creator",
  },
  {
    id: "well_rounded",
    title: "Balanced build",
    description: "Every core stat at 40 or higher.",
    test: (s) =>
      s.health >= 40 &&
      s.happiness >= 40 &&
      s.intelligence >= 40 &&
      s.socialSkill >= 40 &&
      s.romanticSkill >= 40,
  },
  {
    id: "legacy_years",
    title: "Legacy chapter",
    description: "Turned 65 — legacy vitals are in play.",
    test: (s) => s.age >= 65,
  },
  {
    id: "golden_years",
    title: "Golden stretch",
    description: "Reached your eighties — stubborn, lucky, or both.",
    test: (s) => s.age >= 80,
  },
  {
    id: "story_epilogue",
    title: "Last page",
    description: "Closed the book on a full run — epilogue reached.",
    test: (s) => s.currentNodeId === "life_epilogue",
  },
  {
    id: "story_death",
    title: "Mortality",
    description: "Health hit zero — every run ends somewhere.",
    test: (s) => s.gamePhase === "dead",
  },
  {
    id: "philanthropy_major",
    title: "Serious giver",
    description: "Made a major philanthropic gift while alive.",
    test: (s) => s.flags.includes("major_donor"),
  },
  {
    id: "will_balanced",
    title: "Balanced ledger",
    description: "Chose a balanced will for heirs and causes.",
    test: (s) => s.flags.includes("estate_balanced_will"),
  },
  {
    id: "will_charity",
    title: "Cause-driven estate",
    description: "Tilted the estate toward charity.",
    test: (s) => s.flags.includes("estate_charity_focus"),
  },
  {
    id: "vacation_taker",
    title: "Out of office",
    description: "Finally took a real vacation — money into memories.",
    test: (s) => s.flags.includes("took_vacation"),
  },
  {
    id: "passport_three",
    title: "Passport warming up",
    description: "Visited at least three countries on your travels.",
    test: (s) => s.countriesVisited.length >= 3,
  },
  {
    id: "globetrotter",
    title: "Globetrotter",
    description: "Seven or more countries stamped — you got around.",
    test: (s) => s.countriesVisited.length >= 7,
  },
  {
    id: "nomad_life",
    title: "No fixed address",
    description: "Chose the nomad path — living out of bags more than closets.",
    test: (s) => s.flags.includes("nomad_lifestyle"),
  },
  {
    id: "relocated_pro",
    title: "Chased the league",
    description: "Moved countries for pro-sports stakes (often the U.S. pipeline).",
    test: (s) => s.flags.includes("relocated_for_pro_sports"),
  },
  {
    id: "relocated_work_us",
    title: "Bay to borough",
    description: "Relocated to the U.S. to chase startup odds and capital.",
    test: (s) => s.flags.includes("relocated_for_work_us"),
  },
  {
    id: "conflict_wave",
    title: "Too close to the news",
    description: "Lived through a regional conflict surge where you were rooted.",
    test: (s) => s.flags.includes("felt_regional_conflict_wave"),
  },
  {
    id: "military_completed",
    title: "Signed and survived",
    description: "Finished military or national service without a disabling wound.",
    test: (s) => s.flags.includes("military_service_completed"),
  },
  {
    id: "military_wounded",
    title: "Service scar",
    description: "Badly injured in service — pro-athlete dreams off the table.",
    test: (s) => s.flags.includes("military_service_injury"),
  },
  {
    id: "polyglot",
    title: "Many tongues",
    description: "Spoke four or more languages at any level in this run.",
    test: (s) => Object.keys(s.languageLevels).length >= 4,
  },
];

const CATALOG: Record<string, { title: string; description: string }> =
  Object.fromEntries(
    ACHIEVEMENTS.map((a) => [
      a.id,
      { title: a.title, description: a.description },
    ]),
  );

export function getAchievementMeta(id: string): {
  title: string;
  description: string;
} {
  return CATALOG[id] ?? { title: id, description: "" };
}

export function unlockAchievements(state: GameState): GameState {
  const have = new Set(state.achievementIds);
  const added: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!have.has(a.id) && a.test(state)) {
      added.push(a.id);
      have.add(a.id);
    }
  }
  if (added.length === 0) return state;
  return { ...state, achievementIds: [...state.achievementIds, ...added] };
}
