// Fails the build if api/_data/content.json is stale relative to content/content.ts.
import { readFileSync } from "node:fs";
import * as content from "../content/content.ts";

const current = JSON.stringify(content, null, 2) + "\n";
const saved = readFileSync(new URL("../api/_data/content.json", import.meta.url), "utf8");
if (current !== saved) {
  console.error("content.ts changed but the chat corpus wasn't rebuilt. Run `npm run corpus` and commit the result.");
  process.exit(1);
}
