// Exports content/content.ts to JSON so the Python side can build the chat corpus.
// Node 23.6+ strips TypeScript types natively.
import { writeFileSync } from "node:fs";
import * as content from "../content/content.ts";

const out = new URL("../api/_data/content.json", import.meta.url);
writeFileSync(out, JSON.stringify(content, null, 2) + "\n");
console.log(`wrote ${out.pathname}`);
