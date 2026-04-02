# Life extension, mortality, and legacy (multi-agent plan)

Living spec for parallel implementation. **Do not edit the Cursor plan file**; update this doc’s changelog when milestones land.

## Changelog

- **2026-03-31** — Initial implementation: extended spine to elder years, health-based death, legacy vitals (50+ UI), estate/charity summary, wealth-gated donations, achievements, `CONTENT_VERSION` 12.

---

## Current baseline (from codebase)

- **Progression:** `content/nodes.json` — after `young_adult_fork`, midlife branches → extended life spine → `life_epilogue` or `death_natural`.
- **Terminal detection:** `lib/game/engine.ts` — `isAtTerminal`: empty visible choices or all `nextNodeId === null`.
- **State:** `lib/game/types.ts` — `GameState` includes legacy vitals, `lifetimeDonatedTotal`, `gamePhase`, optional `deathCause`.
- **Net worth / estate:** UI `netWorth = assets - debt`; `computeEstateSummary` uses `estateGross = max(0, assets - debt) + homeValue`.

---

## Design summary

1. **Mortality:** `health <= 0` → navigate to `death_natural`, `gamePhase: "dead"`. Post-50 aging drift escalates by decade.
2. **Legacy vitals (50+ in UI):** `legacyFamilyHarmony`, `legacyRepute`, `legacyGenerosity`, `legacyHeirReadiness` (0–100), updated via `StatDelta` on choices/nodes.
3. **Charity:** Choices may set `minNetWorth` (assets − debt); optional `lifetimeDonatedDelta` in deltas. Will flags: `estate_family_first`, `estate_balanced_will`, `estate_charity_focus`.
4. **Workstreams:** A engine · B content · C UI · D achievements · E integration (`npm run build`, old saves, charity + split-will path).

---

## Merge protocol

1. Types + engine before large content drops.
2. Bump `CONTENT_VERSION` once per release; migrate in `parseGameState` / `migrateLegacyState`.
3. All `nextNodeId` must resolve to real nodes.

---

## Definition of done

- Playable path from character setup through **life epilogue** or **death from health**.
- Terminal UI shows **Play again**; epilogue/death panels show estate summary when applicable.
- Old saves load with defaults for new fields.
