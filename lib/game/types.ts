export const CONTENT_VERSION = 1;

export type StatDelta = {
  health?: number;
  happiness?: number;
  money?: number;
  ageDelta?: number;
};

export type Choice = {
  id: string;
  label: string;
  /** null = end of run (show ending UI) */
  nextNodeId: string | null;
  deltas?: StatDelta;
  flagsAdd?: string[];
};

export type LifeNode = {
  id: string;
  title?: string;
  body: string;
  onEnter?: StatDelta;
  choices: Choice[];
};

export type GameState = {
  age: number;
  health: number;
  happiness: number;
  /** whole dollars */
  money: number;
  flags: string[];
  currentNodeId: string;
  contentVersion: number;
};

export type ContentBundle = {
  version: number;
  nodes: Record<string, LifeNode>;
};
