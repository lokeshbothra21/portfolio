// Fails the build if a set's architecture diagram doesn't fit its content:
// every set needs a diagram, and every module must appear within the set's steps.
import { sets } from "../content/content.ts";
import { diagrams, layout } from "../scene/diagrams.ts";

const problems = [];
for (const s of sets) {
  const d = diagrams[s.id];
  if (!d) {
    problems.push(`${s.id}: no diagram in scene/diagrams.ts`);
    continue;
  }
  const steps = s.steps.length + 2;
  for (const m of d.modules) {
    if (m.step >= steps) problems.push(`${s.id}/${m.id}: step ${m.step} but the set has ${steps} steps`);
    if (m.rejectAt !== undefined && (m.rejectAt <= m.step || m.rejectAt >= steps)) problems.push(`${s.id}/${m.id}: rejectAt ${m.rejectAt} out of range`);
    if (m.x < 0 || m.z < 0) problems.push(`${s.id}/${m.id}: off the baseplate`);
  }
  try {
    const out = layout(d, steps);
    for (const m of out.modules) if (m.x + m.w > d.base.w || m.z + m.d > d.base.d) problems.push(`${s.id}/${m.id}: off the baseplate`);
    const cells = new Map();
    for (const m of out.modules)
      for (let i = 0; i < m.w; i++)
        for (let j = 0; j < m.d; j++) {
          const k = `${m.x + i},${m.z + j}`;
          if (cells.has(k)) problems.push(`${s.id}: ${m.id} overlaps ${cells.get(k)} at ${k}`);
          cells.set(k, m.id);
        }
  } catch (e) {
    problems.push(`${s.id}: ${e.message}`);
  }
}
for (const p of problems) console.error(p);
if (problems.length) process.exit(1);
