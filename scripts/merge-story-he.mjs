import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const partsDir = path.join(root, "content", "story-he-parts");

const files = fs.readdirSync(partsDir).filter((f) => f.endsWith(".json")).sort();
const merged = {};
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(partsDir, f), "utf8"));
  Object.assign(merged, j);
}

const nodes = JSON.parse(
  fs.readFileSync(path.join(root, "content", "nodes.json"), "utf8"),
);
const required = [];
for (const [nid, n] of Object.entries(nodes.nodes)) {
  if (n.title) required.push(`${nid}__title`);
  required.push(`${nid}__body`);
  for (const c of n.choices ?? []) required.push(`${nid}__${c.id}`);
}
for (const k of [
  "synthetic__regional_conflict__title",
  "synthetic__regional_conflict__body",
  "synthetic__military_rehab__title",
  "synthetic__military_rehab__body",
  "synthetic__military_injury__title",
  "synthetic__military_injury__body",
]) {
  required.push(k);
}

const missing = required.filter((k) => merged[k] === undefined);
if (missing.length) {
  console.error("Missing Hebrew keys:", missing.length, missing.slice(0, 20));
  process.exit(1);
}

fs.writeFileSync(
  path.join(root, "content", "story-he.json"),
  JSON.stringify(merged),
);

console.log("Wrote content/story-he.json keys:", Object.keys(merged).length);
