import { CONTENT_VERSION, type GameState, type StatDelta } from "./types";
import { getContent, getNode, getStartNodeId } from "./content";

const MIN_STAT = 0;
const MAX_STAT = 100;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function applyDelta(state: GameState, d: StatDelta | undefined): GameState {
  if (!d) return state;
  let { age, health, happiness, money } = state;
  if (d.health !== undefined) health += d.health;
  if (d.happiness !== undefined) happiness += d.happiness;
  if (d.money !== undefined) money += d.money;
  if (d.ageDelta !== undefined) age += d.ageDelta;
  return {
    ...state,
    age,
    health: clamp(health, MIN_STAT, MAX_STAT),
    happiness: clamp(happiness, MIN_STAT, MAX_STAT),
    money,
  };
}

function mergeFlags(flags: string[], add: string[] | undefined): string[] {
  if (!add?.length) return flags;
  const set = new Set(flags);
  for (const f of add) set.add(f);
  return [...set];
}

export function createInitialState(): GameState {
  return {
    age: 8,
    health: 80,
    happiness: 80,
    money: 0,
    flags: [],
    currentNodeId: getStartNodeId(),
    contentVersion: CONTENT_VERSION,
  };
}

/** True when node has no navigable choices (demo ending). */
export function isAtTerminal(state: GameState): boolean {
  const node = getNode(state.currentNodeId);
  if (!node) return true;
  if (node.choices.length === 0) return true;
  return node.choices.every((c) => c.nextNodeId === null);
}

export function applyOnEnterIfNeeded(state: GameState): GameState {
  const node = getNode(state.currentNodeId);
  if (!node?.onEnter) return state;
  return applyDelta(state, node.onEnter);
}

export function applyChoice(state: GameState, choiceIndex: number): GameState {
  const node = getNode(state.currentNodeId);
  if (!node) throw new Error(`Unknown node: ${state.currentNodeId}`);
  const choice = node.choices[choiceIndex];
  if (!choice) throw new Error(`Invalid choice index: ${choiceIndex}`);

  let next: GameState = {
    ...state,
    flags: mergeFlags(state.flags, choice.flagsAdd),
  };
  next = applyDelta(next, choice.deltas);

  if (choice.nextNodeId === null) {
    return { ...next, currentNodeId: state.currentNodeId };
  }

  next = { ...next, currentNodeId: choice.nextNodeId };
  return applyOnEnterIfNeeded(next);
}

export function assertContentVersion(state: GameState): GameState {
  if (state.contentVersion === CONTENT_VERSION) return state;
  return createInitialState();
}

export function validateStateShape(data: unknown): GameState | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.age !== "number") return null;
  if (typeof o.health !== "number") return null;
  if (typeof o.happiness !== "number") return null;
  if (typeof o.money !== "number") return null;
  if (!Array.isArray(o.flags) || !o.flags.every((f) => typeof f === "string"))
    return null;
  if (typeof o.currentNodeId !== "string") return null;
  if (typeof o.contentVersion !== "number") return null;
  return {
    age: o.age,
    health: o.health,
    happiness: o.happiness,
    money: o.money,
    flags: o.flags as string[],
    currentNodeId: o.currentNodeId,
    contentVersion: o.contentVersion,
  };
}

export function getVisibleNode(state: GameState) {
  return getNode(state.currentNodeId);
}

export { getContent, getNode, CONTENT_VERSION };
