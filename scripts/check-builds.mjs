// Fails the build if a set's 3D build doesn't have one step per content step (+ intro and check).
import { sets } from "../content/content.ts";
import { setBuilds } from "../scene/builds.ts";

const bad = sets.filter((s) => setBuilds[s.id] && setBuilds[s.id].steps.length !== s.steps.length + 2);
for (const s of bad) console.error(`scene/builds.ts: "${s.id}" has ${setBuilds[s.id].steps.length} steps, content needs ${s.steps.length + 2}`);
if (bad.length) process.exit(1);
