// Hand-placed builds for the tour cover and the Technic machine frame.
// The sets themselves are architecture diagrams: see diagrams.ts.
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

// ------------------------------------------------------------------ Technic machine (static frame)
// Moving parts (question brick, gate arm, gears, stamp) live in Machine.tsx.

export const MACHINE = { retrieve: 4, gate: 7.5, llm: 12, verify: 16, end: 18.5, start: 1, belt: 4, bin: { x: 8, z: 7 } };

export const machine: Build = {
  base: { w: 20, d: 9, c: "grey" },
  camera: { position: [11, 19.5, 29], target: [10, 1, 4.5] },
  steps: [
    {
      add: [
        tile(0, 0, 3, 20, 2, "black"),
        tile(0, 0, 2, 20, 1, "yellow"),
        tile(0, 0, 5, 20, 1, "yellow"),
        // Retrieve: a gantry over the belt carrying a BM25 light and an embeddings light.
        ...stack(3, 0, 2, 2, 3, ["blue", "purple"]),
        plate(3, 9, 0, 2, 6, "white"),
        // Gate: the post the barrier arm hinges on, and the bin for declined questions.
        ...stack(7, 0, 1, 1, 3, "grey"),
        plate(6, 0, 6, 4, 3, "black"),
        brick(6, 1, 8, 4, 1, "dark"),
        brick(6, 1, 6, 1, 2, "dark"),
        brick(9, 1, 6, 1, 2, "dark"),
        tile(6, 4, 8, 4, 1, "red"),
        // LLM: the gearbox behind the belt.
        ...stack(10, 0, 4, 2, 2, "orange"),
        // Verify: the stamp gantry.
        ...stack(15, 0, 2, 2, 3, "green"),
        plate(15, 9, 0, 2, 6, "white"),
      ],
    },
  ],
};
