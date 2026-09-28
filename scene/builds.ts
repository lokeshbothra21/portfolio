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

// ------------------------------------------------------------------ Set #02 Scientific Literature RAG

const literatureRag: Build = {
  base: { w: 14, d: 12, c: "tan" },
  camera: { position: [25, 19, 31], target: [7, 1.5, 5.5] },
  steps: [
    // Intro: the reading-room floor.
    { add: [tile(3, 0, 7, 8, 4, "blue"), tile(4, 1, 8, 6, 2, "azure")] },
    // 1 Chunk by structure: a shelf of papers, split into sections.
    {
      add: [
        plate(0, 0, 0, 9, 2, "dark"),
        ...(["red", "white", "blue", "yellow", "white", "green", "orange", "white", "purple"] as Colour[]).map((c, i) => brick(i, 1, 0, 1, 2, c)),
        plate(0, 4, 0, 9, 2, "dark"),
        ...(["white", "azure", "white", "pink", "white", "lime", "white", "yellow", "white"] as Colour[]).map((c, i) => brick(i, 5, 0, 1, 2, c)),
        plate(0, 8, 0, 9, 2, "dark"),
      ],
    },
    // 2 Retrieve two ways: a BM25 tower and a FAISS tower, bridged by the reranker.
    {
      add: [
        ...stack(10, 0, 2, 2, 3, "blue"),
        ...stack(10, 4, 2, 2, 3, "purple"),
        plate(10, 9, 0, 2, 6, "orange"),
        brick(10, 10, 2, 1, 1, "trans-clear", { round: true }),
        brick(11, 10, 3, 1, 1, "trans-clear", { round: true }),
      ],
    },
    // 3 Decompose the question: one big question splits into three sub-questions.
    {
      add: [
        brick(6, 2, 8, 2, 2, "yellow"),
        brick(2, 0, 9, 1, 1, "yellow"),
        brick(9, 0, 9, 1, 1, "yellow"),
        brick(6, 5, 8, 1, 1, "yellow"),
        // A guess the old pipeline would have given when evidence was thin.
        { ...brick(12, 0, 8, 1, 1, "pink"), id: "guess-0" },
        { ...brick(12, 3, 8, 1, 1, "pink"), id: "guess-1" },
      ],
    },
    // 4 Keep indexes live: documents on a conveyor, straight into the index.
    {
      add: [tile(0, 0, 3, 9, 1, "black"), ...[1, 3, 5, 7].map((x) => tile(x, 1, 3, 1, 1, "white"))],
    },
    // 5 Harden for production: a wall with a rate-limit light.
    {
      add: [...[0, 2, 4, 10, 12].map((x) => brick(x, 0, 11, 2, 1, "grey")), brick(13, 3, 11, 1, 1, "trans-red", { round: true, glow: true })],
    },
    // Check: abstain instead of guessing, and measure. Before/after bars for both RAGAS scores.
    {
      reject: ["guess-0", "guess-1"],
      add: [
        ...stack(12, 5, 1, 1, 2, "grey"),
        plate(12, 6, 5, 1, 1, "grey"),
        ...stack(13, 5, 1, 1, 2, "green"),
        plate(13, 6, 5, 1, 1, "green"),
        plate(13, 7, 5, 1, 1, "green"),
        plate(13, 8, 5, 1, 1, "green"),
        brick(12, 0, 7, 1, 1, "white"),
        tile(12, 3, 7, 1, 1, "white"),
      ],
    },
  ],
};

// ------------------------------------------------------------------ Set #03 AI Sports Analytics

const sportsAnalytics: Build = {
  base: { w: 14, d: 12, c: "base" },
  camera: { position: [25, 19, 31], target: [7, 1.5, 5.5] },
  steps: [
    // Intro: pitch markings.
    { add: [tile(6, 0, 0, 2, 12, "white"), tile(0, 0, 0, 14, 1, "white"), tile(0, 0, 11, 14, 1, "white")] },
    // 1 Text to SQL: the BigQuery warehouse and a coach asking a question.
    {
      add: [
        ...stack(1, 1, 2, 2, 3, "blue").map((b) => ({ ...b, round: true })),
        tile(1, 9, 1, 2, 2, "azure", { round: true }),
        brick(4, 0, 4, 1, 1, "black"),
        brick(4, 3, 4, 1, 1, "red"),
        brick(4, 6, 4, 1, 1, "yellow", { round: true }),
        // A generated query that would have returned the wrong rows.
        { ...brick(3, 0, 1, 1, 1, "pink"), id: "bad-sql" },
      ],
    },
    // 2 Tools over MCP: an agent wired to the warehouse.
    {
      add: [tile(3, 0, 2, 3, 1, "black"), ...stack(8, 1, 2, 2, 2, ["dark", "azure"]), brick(8, 6, 1, 1, 1, "trans-clear", { round: true, glow: true })],
    },
    // 3 See beyond text: a scoreboard it can read, charts and tables included.
    {
      add: [
        plate(9, 0, 5, 4, 1, "black"),
        ...glyph([".###", "#..#", "####"], 9, 5, "white").map((b) => ({ ...b, y: b.y + 1 })),
        ...glyph(["#...", "#.#.", "####"], 9, 5, "orange").map((b) => ({ ...b, y: b.y + 1, z: 6 })),
      ],
    },
    // 4 Sandboxed charts: generated Python runs inside a clear box.
    {
      add: [
        plate(1, 0, 7, 4, 3, "white"),
        ...[1, 3, 2, 3].flatMap((h, i) => stack(1 + i, 8, 1, 1, h, ["orange", "yellow", "red"][i % 3] as Colour, 1)),
        ...stack(1, 7, 4, 1, 3, "trans-clear", 1),
        ...stack(1, 9, 4, 1, 3, "trans-clear", 1),
      ],
    },
    // 5 Lock it down: coaches and data scientists see different datasets.
    {
      add: [
        ...[6, 7, 8, 9, 10].map((z) => brick(11, 0, z, 1, 1, "black")),
        brick(12, 0, 8, 1, 1, "blue"),
        brick(12, 3, 8, 1, 1, "blue"),
        brick(12, 6, 8, 1, 1, "yellow", { round: true }),
        tile(11, 3, 8, 1, 1, "yellow"),
      ],
    },
    // Check: validate and self-correct. The bad query never reaches a coach.
    {
      reject: ["bad-sql"],
      add: [plate(4, 0, 1, 2, 2, "white"), tile(4, 1, 1, 1, 1, "green"), tile(5, 1, 2, 1, 1, "green")],
    },
  ],
};

// ------------------------------------------------------------------ Set #04 Rally

const rally: Build = {
  base: { w: 14, d: 10, c: "grey" },
  camera: { position: [24, 18, 28], target: [7, 1.5, 4.5] },
  steps: [
    // Intro: the mailroom floor.
    { add: [tile(0, 0, 4, 14, 2, "black")] },
    // 1 Ingest without blocking: a document server and its Celery workers (green, obviously).
    {
      add: [
        ...stack(1, 0, 2, 3, 3, "white"),
        tile(1, 9, 0, 2, 1, "lime"),
        ...[4, 5, 6].flatMap((x, i) => stack(x, 1, 1, 1, i + 1, "green")),
        ...[8, 9, 10].map((x) => tile(x, 1, 4, 1, 2, "white")),
      ],
    },
    // 2 Sync only what changed: the mailbox, and just the new mail moving.
    {
      add: [
        ...stack(11, 0, 2, 2, 2, "blue"),
        tile(11, 6, 0, 2, 2, "blue"),
        brick(13, 3, 0, 1, 1, "red"),
        tile(12, 1, 4, 1, 2, "yellow"),
        // Old, unchanged mail that a full re-sync would have processed again.
        { ...tile(5, 1, 4, 1, 2, "pink"), id: "stale-0" },
        { ...tile(6, 1, 4, 1, 2, "pink"), id: "stale-1" },
      ],
    },
    // 3 Retrieve fast: pgvector with Redis on top.
    {
      add: [...stack(1, 7, 2, 2, 3, "azure").map((b) => ({ ...b, round: true })), brick(1, 9, 7, 1, 1, "red", { round: true }), brick(2, 9, 8, 1, 1, "red", { round: true })],
    },
    // Check: measure the win. Handling time before and after: 40% shorter.
    {
      reject: ["stale-0", "stale-1"],
      add: [...stack(10, 7, 1, 1, 5, "grey"), ...stack(12, 7, 1, 1, 3, "green")],
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

export const setBuilds: Record<string, Build> = {
  aegisops,
  "literature-rag": literatureRag,
  "sports-analytics": sportsAnalytics,
  rally,
};
