import type { ContentBundle, LifeNode } from "./types";
import raw from "@/content/nodes.json";

const bundle = raw as ContentBundle;

export function getContent(): ContentBundle {
  return bundle;
}

export function getNode(id: string): LifeNode | undefined {
  return bundle.nodes[id];
}

export function getStartNodeId(): string {
  return "character_setup";
}
