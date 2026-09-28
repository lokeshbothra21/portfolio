// What gets built on each tour page. Set builds have one entry per step:
// [intro, ...content steps, check], so they line up with content/content.ts.
import type { BrickSpec, Colour } from "./bricks";

export type Step = {
  add: BrickSpec[];
  /** ids of earlier bricks the verifier throws off at this step */
  reject?: string[];
};

export type Build = {
  base: { w: number; d: number; c: Colour };
  steps: Step[];
  camera: { position: [number, number, number]; target: [number, number, number] };
};

type Extra = Partial<Pick<BrickSpec, "id" | "tile" | "round" | "glow">>;
const brick = (x: number, y: number, z: number, w: number, d: number, c: Colour, extra: Extra = {}): BrickSpec => ({ x, y, z, w, d, h: 3, c, ...extra });
const plate = (x: number, y: number, z: number, w: number, d: number, c: Colour, extra: Extra = {}): BrickSpec => ({ x, y, z, w, d, h: 1, c, ...extra });
const tile = (x: number, y: number, z: number, w: number, d: number, c: Colour, extra: Extra = {}): BrickSpec => ({ x, y, z, w, d, h: 1, c, tile: true, ...extra });

/** A stack of identical bricks, `levels` high, starting at plate level `y`. */
const stack = (x: number, z: number, w: number, d: number, levels: number, colours: Colour | Colour[], y = 0): BrickSpec[] =>
  Array.from({ length: levels }, (_, i) => brick(x, y + i * 3, z, w, d, Array.isArray(colours) ? colours[i % colours.length] : colours));

/** Rows of a pixel glyph (top row first) turned into a wall of 1x1 bricks. */
const glyph = (rows: string[], x0: number, z: number, c: Colour): BrickSpec[] =>
  rows.flatMap((row, r) =>
    [...row].flatMap((ch, i) => (ch === "#" ? [brick(x0 + i, (rows.length - 1 - r) * 3, z, 1, 1, c)] : [])),
  );

// ------------------------------------------------------------------ cover

export const cover: Build = {
  base: { w: 14, d: 8, c: "base" },
  camera: { position: [7, 9.5, 30], target: [7, 3, 3] },
  steps: [
    {
      add: [
        ...glyph(["#...", "#...", "#...", "#...", "####"], 1, 2, "red"),
        ...glyph(["###.", "#..#", "###.", "#..#", "###."], 7, 2, "blue"),
        // Loose pieces tipped out of the box.
        brick(1, 0, 5, 4, 2, "orange"),
        brick(6, 0, 5, 2, 2, "green"),
        brick(6, 3, 5, 2, 2, "yellow"),
        plate(9, 0, 5, 2, 2, "purple"),
        // The "checked build" seal.
        brick(12, 0, 3, 1, 1, "yellow", { round: true }),
        brick(12, 3, 3, 1, 1, "yellow", { round: true }),
        tile(12, 6, 3, 1, 1, "trans-green", { round: true, glow: true }),
      ],
    },
  ],
};

// ------------------------------------------------------------------ Set #01 AegisOps

const aegisops: Build = {
  base: { w: 14, d: 12, c: "dark" },
  camera: { position: [25, 19, 31], target: [7, 1.5, 5.5] },
  steps: [
    // Intro: the empty ops floor.
    { add: [tile(0, 0, 11, 14, 1, "yellow"), tile(0, 0, 0, 1, 11, "yellow")] },
    // 1 Detect: telemetry rack and the alarm tower that fired 57 s after the fault.
    {
      add: [
        ...stack(1, 1, 2, 3, 3, "black"),
        tile(1, 9, 1, 1, 1, "lime"),
        tile(2, 9, 2, 1, 1, "lime"),
        tile(1, 9, 3, 1, 1, "lime"),
        ...stack(11, 1, 2, 2, 3, ["grey", "white"]),
        brick(11, 9, 1, 1, 1, "trans-red", { round: true, glow: true }),
      ],
    },
    // 2 Triage and plan: the six LangGraph nodes, one colour each.
    {
      add: (["yellow", "orange", "red", "purple", "blue", "green"] as Colour[]).map((c, i) => brick(1 + i * 2, 0, 6, 2, 2, c)),
    },
    // 3 Investigate with tools: nine read-only MCP tools as a bar chart...
    {
      add: [
        plate(5, 0, 1, 3, 3, "white"),
        ...[1, 2, 3, 2, 3, 1, 3, 1, 2].flatMap((h, i) => stack(5 + (i % 3), 1 + Math.floor(i / 3), 1, 1, h, i % 2 ? "azure" : "blue", 1)),
        // ...and one metric the LLM invented. It looks just like the others.
        ...stack(9, 2, 1, 1, 3, "pink", 0).map((b, i) => ({ ...b, id: `invented-${i}` })),
      ],
    },
    // 4 Stay on budget: a gauge with a hard limit bar.
    {
      add: [...stack(1, 9, 1, 2, 3, ["green", "yellow", "orange"]), tile(1, 9, 9, 1, 2, "black"), plate(2, 0, 9, 1, 2, "grey")],
    },
    // 5 Human in the loop: a person and the only approve button.
    {
      add: [
        brick(6, 0, 9, 1, 1, "blue"),
        brick(6, 3, 9, 1, 1, "red"),
        brick(6, 6, 9, 1, 1, "yellow", { round: true }),
        brick(8, 0, 8, 2, 2, "grey"),
        tile(8, 3, 8, 2, 2, "trans-green", { round: true, glow: true }),
      ],
    },
    // Check: every claim is verified against telemetry. The invented metric gets thrown out.
    {
      reject: ["invented-0", "invented-1", "invented-2"],
      add: [
        plate(11, 0, 8, 3, 3, "white"),
        tile(11, 1, 9, 1, 1, "green"),
        tile(12, 1, 10, 1, 1, "green"),
        tile(13, 1, 8, 1, 1, "green"),
        tile(13, 1, 9, 1, 1, "green"),
      ],
    },
  ],
};

export const setBuilds: Record<string, Build> = { aegisops };
