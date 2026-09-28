// Each set's architecture, built from bricks. Modules are the system's real
// components; edges are the data flow between them, laid as conveyor tiles.
// Module `step` indexes the set's build steps: 0 = box contents, 1..n = content
// steps, n + 1 = check.
import type { BrickSpec, Colour } from "./bricks";
import type { Build } from "./builds";

export type Module = {
  id: string;
  label: string;
  caption: string;
  step: number;
  x: number;
  z: number;
  kind: "box" | "cylinder" | "grid" | "person";
  c: Colour;
  w?: number;
  d?: number;
  levels?: number; // box/cylinder height in bricks
  n?: number; // grid: number of items
  palette?: Colour[]; // grid colours
  beacon?: boolean; // glowing light on top
  button?: boolean; // person: approve button beside them
  rejectAt?: number; // thrown off the build at this step (the thing the check catches)
};

export type Edge = [from: string, to: string];

export type Diagram = {
  base: { w: number; d: number; c: Colour };
  modules: Module[];
  edges: Edge[];
};

export type Cell = [number, number];

export type LaidOut = {
  build: Build;
  modules: (Module & { w: number; d: number; top: number; centre: [number, number] })[];
  edges: { from: string; to: string; step: number; path: Cell[] }[];
};

const PLATE_H = 0.4;
const brick = (x: number, y: number, z: number, w: number, d: number, c: Colour, extra: Partial<BrickSpec> = {}): BrickSpec => ({ x, y, z, w, d, h: 3, c, ...extra });

function footprint(m: Module): { w: number; d: number } {
  if (m.kind === "person") return { w: m.button ? 2 : 1, d: 1 };
  if (m.kind === "grid") {
    const n = m.n ?? 1;
    const w = m.w ?? Math.ceil(Math.sqrt(n));
    return { w, d: m.d ?? Math.ceil(n / w) };
  }
  return { w: m.w ?? 2, d: m.d ?? 2 };
}

/** The bricks that make up one module, and the height of its top in world units. */
function moduleBricks(m: Module): { bricks: BrickSpec[]; top: number } {
  const { w, d } = footprint(m);
  const out: BrickSpec[] = [];
  let levels = 1;
  if (m.kind === "box") {
    levels = m.levels ?? 2;
    for (let i = 0; i < levels; i++) out.push(brick(m.x, i * 3, m.z, w, d, m.c));
  } else if (m.kind === "cylinder") {
    levels = m.levels ?? 2;
    for (let i = 0; i < levels; i++) out.push(brick(m.x, i * 3, m.z, w, w, m.c, { round: true }));
  } else if (m.kind === "grid") {
    const n = m.n ?? 1;
    for (let i = 0; i < n; i++) {
      const c = m.palette ? m.palette[i % m.palette.length] : m.c;
      out.push(brick(m.x + (i % w), 0, m.z + Math.floor(i / w), 1, 1, c));
    }
  } else {
    out.push(brick(m.x, 0, m.z, 1, 1, "blue"), brick(m.x, 3, m.z, 1, 1, m.c), brick(m.x, 6, m.z, 1, 1, "yellow", { round: true }));
    levels = 3;
    if (m.button) out.push(brick(m.x + 1, 0, m.z, 1, 1, "grey"), { x: m.x + 1, y: 3, z: m.z, w: 1, d: 1, h: 1, c: "trans-green", tile: true, round: true, glow: true });
  }
  if (m.beacon) {
    out.push(brick(m.x + Math.floor(w / 2) - (w > 1 ? 1 : 0), levels * 3, m.z, 1, 1, "trans-red", { round: true, glow: true }));
    levels += 1;
  }
  return { bricks: out, top: levels * 3 * PLATE_H };
}

const centreCell = (x: number, z: number, w: number, d: number): Cell => [x + Math.floor((w - 1) / 2), z + Math.floor((d - 1) / 2)];

/** Manhattan path between two module centres: along x first, then along z. */
function route(a: Cell, b: Cell): Cell[] {
  const cells: Cell[] = [];
  const [ax, az] = a;
  const [bx, bz] = b;
  const sx = Math.sign(bx - ax);
  for (let x = ax; x !== bx; x += sx) cells.push([x, az]);
  const sz = Math.sign(bz - az);
  for (let z = az; z !== bz; z += sz) cells.push([bx, z]);
  cells.push([bx, bz]);
  return cells;
}

export function layout(diagram: Diagram, steps: number): LaidOut {
  const occupied = new Set<string>();
  const modules = diagram.modules.map((m) => {
    const { w, d } = footprint(m);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) occupied.add(`${m.x + i},${m.z + j}`);
    return { ...m, w, d, top: moduleBricks(m).top, centre: centreCell(m.x, m.z, w, d) };
  });
  const byId = new Map(modules.map((m) => [m.id, m]));

  const buildSteps: Build["steps"] = Array.from({ length: steps }, () => ({ add: [] as BrickSpec[] }));
  for (const m of modules) {
    const bricks = moduleBricks(m).bricks.map((b, i) => (m.rejectAt !== undefined ? { ...b, id: `${m.id}-${i}` } : b));
    buildSteps[m.step].add.push(...bricks);
    if (m.rejectAt !== undefined) (buildSteps[m.rejectAt].reject ??= []).push(...bricks.map((b) => b.id!));
  }

  const tiled = new Set<string>();
  const edges = diagram.edges.map(([from, to]) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) throw new Error(`diagram edge ${from} -> ${to}: unknown module`);
    const step = Math.max(a.step, b.step);
    const path = route(a.centre, b.centre);
    // Paths that share a stretch of conveyor share its tiles.
    const tiles = path
      .filter(([x, z]) => !occupied.has(`${x},${z}`) && !tiled.has(`${x},${z}`))
      .map(([x, z]): BrickSpec => {
        tiled.add(`${x},${z}`);
        return { x, y: 0, z, w: 1, d: 1, h: 1, c: "black", tile: true };
      });
    buildSteps[step].add.push(...tiles);
    return { from, to, step, path };
  });

  const { w, d } = diagram.base;
  const build: Build = {
    base: diagram.base,
    steps: buildSteps,
    // Fairly top-down, so the build reads like an architecture diagram.
    camera: { position: [w / 2 + w * 0.3, w * 1.25, d / 2 + w * 1.1], target: [w / 2, 0.5, d / 2] },
  };
  return { build, modules, edges };
}

// ------------------------------------------------------------------ Set #01 AegisOps
// 0 box, 1 detect, 2 triage & plan, 3 tools, 4 budget, 5 human, 6 check

const aegisops: Diagram = {
  base: { w: 20, d: 12, c: "grey" },
  modules: [
    { id: "services", label: "15 microservices", caption: "the system being watched", step: 0, x: 1, z: 1, kind: "grid", n: 15, w: 5, c: "white", palette: ["white", "grey", "tan"] },
    { id: "otel", label: "OpenTelemetry", caption: "logs · metrics · traces · changes", step: 1, x: 8, z: 1, kind: "cylinder", c: "blue" },
    { id: "alerts", label: "SQL alert rules", caption: "incident 57 s after the fault", step: 1, x: 12, z: 1, kind: "box", c: "white", levels: 1, beacon: true },
    { id: "graph", label: "LangGraph investigation", caption: "6 nodes: triage → verification", step: 2, x: 13, z: 5, kind: "grid", n: 6, w: 6, c: "purple", palette: ["yellow", "orange", "red", "purple", "blue", "green"] },
    { id: "tools", label: "9 MCP tools", caption: "read-only, output treated as untrusted", step: 3, x: 8, z: 5, kind: "grid", n: 9, c: "azure", palette: ["azure", "blue"] },
    { id: "invented", label: "Invented metric", caption: "cited by the LLM, not in telemetry", step: 3, x: 4, z: 5, kind: "box", c: "pink", w: 1, d: 1, levels: 2, rejectAt: 6 },
    { id: "postgres", label: "Postgres checkpoints", caption: "resume any investigation", step: 4, x: 17, z: 9, kind: "cylinder", c: "azure" },
    { id: "budget", label: "Budgets", caption: "tool calls · tokens · time", step: 4, x: 13, z: 9, kind: "box", c: "orange", levels: 1 },
    { id: "verifier", label: "Evidence verifier", caption: "every citation checked · 0.86 → 0.57", step: 6, x: 7, z: 9, kind: "box", c: "green", levels: 2 },
    { id: "human", label: "Human approval", caption: "the only way to act", step: 5, x: 2, z: 9, kind: "person", c: "red", button: true },
  ],
  edges: [
    ["services", "otel"],
    ["otel", "alerts"],
    ["alerts", "graph"],
    ["graph", "tools"],
    ["graph", "postgres"],
    ["graph", "budget"],
    ["tools", "verifier"],
    ["verifier", "human"],
  ],
};

// ------------------------------------------------------------------ Set #02 Scientific Literature RAG
// 0 box, 1 chunk, 2 retrieve two ways, 3 decompose, 4 live indexes, 5 harden, 6 check

const literatureRag: Diagram = {
  base: { w: 20, d: 12, c: "tan" },
  modules: [
    { id: "pdfs", label: "Research PDFs", caption: "uploaded per user", step: 0, x: 1, z: 1, kind: "grid", n: 6, w: 3, c: "white", palette: ["white", "azure"] },
    { id: "chunker", label: "Structure-aware chunker", caption: "sections, tables, figures", step: 1, x: 6, z: 1, kind: "box", c: "orange", levels: 1 },
    { id: "bm25", label: "BM25", caption: "exact terms", step: 2, x: 10, z: 0, kind: "cylinder", c: "blue" },
    { id: "faiss", label: "FAISS", caption: "Gemini embedding-001", step: 2, x: 10, z: 3, kind: "cylinder", c: "purple" },
    { id: "rerank", label: "BGE reranker", caption: "cross-encoder", step: 2, x: 15, z: 1, kind: "box", c: "yellow", levels: 1 },
    { id: "agent", label: "LangGraph (DeepAgents)", caption: "sub-questions · iterative evidence", step: 3, x: 15, z: 6, kind: "box", c: "purple", levels: 2 },
    { id: "guess", label: "Guessed answer", caption: "what thin evidence used to produce", step: 3, x: 11, z: 7, kind: "box", c: "pink", w: 1, d: 1, levels: 2, rejectAt: 6 },
    { id: "meta", label: "SQL metadata", caption: "per-user isolation · hot index sync", step: 4, x: 6, z: 5, kind: "cylinder", c: "grey" },
    { id: "api", label: "FastAPI + SSE", caption: "auth · retries · rate limits", step: 5, x: 15, z: 9, kind: "box", c: "white", levels: 1 },
    { id: "abstain", label: "Confidence gate", caption: "answers or abstains", step: 6, x: 11, z: 9, kind: "box", c: "green", levels: 1 },
    { id: "ragas", label: "RAGAS eval", caption: "correctness 0.68 → 0.79", step: 6, x: 6, z: 9, kind: "grid", n: 4, w: 4, c: "green", palette: ["grey", "green", "grey", "green"] },
  ],
  edges: [
    ["pdfs", "chunker"],
    ["chunker", "bm25"],
    ["chunker", "faiss"],
    ["bm25", "rerank"],
    ["faiss", "rerank"],
    ["rerank", "agent"],
    ["meta", "faiss"],
    ["agent", "api"],
    ["agent", "abstain"],
    ["abstain", "ragas"],
  ],
};

// ------------------------------------------------------------------ Set #03 AI Sports Analytics
// 0 box, 1 text-to-SQL, 2 MCP tools, 3 multimodal, 4 sandbox, 5 RBAC, 6 check

const sportsAnalytics: Diagram = {
  base: { w: 20, d: 12, c: "base" },
  modules: [
    { id: "coach", label: "Coaches & analysts", caption: "ask in plain English", step: 0, x: 1, z: 5, kind: "person", c: "red" },
    { id: "bigquery", label: "BigQuery", caption: "large sports datasets", step: 0, x: 16, z: 1, kind: "cylinder", c: "blue", levels: 3 },
    { id: "agent", label: "Text-to-SQL agent", caption: "Google ADK · Gemini 2.5 Pro", step: 1, x: 6, z: 4, kind: "box", c: "purple", levels: 2 },
    { id: "badsql", label: "Wrong query", caption: "SQL that would return the wrong rows", step: 1, x: 10, z: 8, kind: "box", c: "pink", w: 1, d: 1, levels: 2, rejectAt: 6 },
    { id: "mcp", label: "MCP tools", caption: "real-time BigQuery access", step: 2, x: 11, z: 1, kind: "grid", n: 4, c: "azure", palette: ["azure", "blue"] },
    { id: "vision", label: "Docling + Gemini Vision", caption: "charts, tables, screenshots", step: 3, x: 6, z: 0, kind: "box", c: "orange", levels: 1 },
    { id: "sandbox", label: "Docker sandbox", caption: "runs generated Python → Plotly", step: 4, x: 5, z: 9, kind: "box", c: "trans-clear", levels: 2, w: 3 },
    { id: "rbac", label: "RBAC · Azure AD", caption: "dataset isolation per role", step: 5, x: 16, z: 6, kind: "box", c: "black", levels: 1 },
    { id: "validator", label: "SQL validator", caption: "self-correction · 95%+ accuracy", step: 6, x: 11, z: 5, kind: "box", c: "green", levels: 1 },
  ],
  edges: [
    ["coach", "agent"],
    ["agent", "mcp"],
    ["mcp", "bigquery"],
    ["vision", "agent"],
    ["agent", "sandbox"],
    ["rbac", "bigquery"],
    ["agent", "validator"],
    ["validator", "mcp"],
  ],
};

// ------------------------------------------------------------------ Set #04 Rally
// 0 box, 1 ingest, 2 delta sync, 3 retrieve, 4 check

const rally: Diagram = {
  base: { w: 20, d: 12, c: "grey" },
  modules: [
    { id: "docs", label: "Enterprise documents", caption: "very large files", step: 0, x: 1, z: 1, kind: "grid", n: 6, w: 3, c: "white", palette: ["white", "tan"] },
    { id: "inbox", label: "Outlook inbox", caption: "via Microsoft Graph", step: 0, x: 1, z: 8, kind: "box", c: "blue", levels: 1 },
    { id: "server", label: "Docling document server", caption: "parses and chunks", step: 1, x: 6, z: 1, kind: "box", c: "white", levels: 2 },
    { id: "celery", label: "Celery workers", caption: "async, non-blocking ingestion", step: 1, x: 10, z: 1, kind: "grid", n: 3, w: 3, c: "green" },
    { id: "sync", label: "Delta email sync", caption: "only what changed", step: 2, x: 6, z: 8, kind: "box", c: "azure", levels: 1 },
    { id: "stale", label: "Unchanged mail", caption: "a full re-sync would redo this", step: 2, x: 4, z: 6, kind: "box", c: "pink", w: 1, d: 1, levels: 1, rejectAt: 4 },
    { id: "pgvector", label: "PostgreSQL · pgvector", caption: "vector retrieval", step: 3, x: 11, z: 5, kind: "cylinder", c: "azure" },
    { id: "redis", label: "Redis", caption: "latency", step: 3, x: 11, z: 9, kind: "cylinder", c: "red", levels: 1 },
    { id: "assistant", label: "Rally assistant", caption: "contextual answers", step: 3, x: 16, z: 5, kind: "box", c: "purple", levels: 2 },
    { id: "measured", label: "40% less handling time", caption: "measured after automation", step: 4, x: 16, z: 9, kind: "box", c: "green", levels: 1 },
  ],
  edges: [
    ["docs", "server"],
    ["server", "celery"],
    ["celery", "pgvector"],
    ["inbox", "sync"],
    ["sync", "pgvector"],
    ["pgvector", "assistant"],
    ["redis", "assistant"],
    ["assistant", "measured"],
  ],
};

export const diagrams: Record<string, Diagram> = {
  aegisops,
  "literature-rag": literatureRag,
  "sports-analytics": sportsAnalytics,
  rally,
};

