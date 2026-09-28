# Portfolio — "Lokesh Bothra · AI Engineer · Set 2026"

A portfolio built as a brick-toy **instruction booklet**. Each project is a boxed
"set" that builds itself step by step, and every build ends with a check step,
because the through-line of the work is *AI that checks its own work*.
The highlight is a **Technic machine**: an "ask me anything" chat where the
visitor watches their question travel through a real retrieval pipeline.

Always one click away: a plain, fast, readable page for recruiters.

---

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Hosting | Vercel Hobby (free, personal non-commercial use) | Free, deploys from GitHub on every push |
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Plain page is pre-rendered HTML: fast, indexable by Google, readable without JS |
| 3D | three.js via `@react-three/fiber` + `@react-three/drei`, loaded lazily | 3D never slows down the plain page |
| Physics (later) | `@react-three/rapier` | Bricks snapping and tumbling |
| Chat backend | FastAPI as a Vercel Python function (`/api`) | Your stack. Fallback: Cloud Run if limits bite |
| LLM | Gemini API (free tier) | Already familiar; embeddings + generation |
| Retrieval | BM25 + dense (precomputed Gemini embeddings in JSON), reciprocal rank fusion, dense-similarity abstention gate | Corpus is a few KB, so no vector DB needed; still shows the real technique |
| Content | One file: `content/content.ts` | Site, chat corpus and 3D labels all read from it; new job = edit text only |
| Naming | "Brick" style, never the LEGO name or logo | Trademark |

## Content map

| Booklet page | Source | Notes |
|---|---|---|
| Cover | Name, title, resume PDF | "AI Engineer · 4 sets inside · Ages 18+" + Tour / Read as page toggle |
| Parts inventory | Skills section | Brick bins by colour: AI Systems, Frameworks, Databases, Vector DBs, Cloud & DevOps |
| Set #01 AegisOps (flagship) | Projects | Open source, can be fully live. Steps = 6 LangGraph nodes; verifier replay (0.86 → 0.57) |
| Set #02 Scientific Literature RAG | Prescience Insilico Pvt Ltd | 0.68 → 0.79 answer correctness, 0.54 → 0.64 context precision |
| Set #03 AI Sports Analytics | HashInclude | Text-to-SQL, MCP, 95%+ query accuracy, 30% DB overhead cut |
| Set #04 Rally | HashInclude | Enterprise RAG, Docling + Celery, 40% less email handling time |
| How it started | Trading & family business 2017–2023 | Origin story: "First build: Excel tools on a trading desk" |
| Bonus pieces | 3 certifications | Collectible badges |
| Technic machine | Chat | Hybrid retrieval → rerank → answer or abstain, with live trace |
| Back cover | Contact | Email, GitHub, LinkedIn, LeetCode (no phone number on the public site) |

Skipped: one confidential project from the current role (not listed anywhere).

---

## Phases

Each phase ends deployed and working; it's fine to stop after any of them.

### Phase 0: Setup (≈ 1 evening) ✅ done
- Scaffold Next.js + TS + Tailwind, ESLint, Prettier
- Push to GitHub, connect to Vercel, first deploy
- **Done when:** a hello page is live on `*.vercel.app`

### Phase 1: Plain page + content (≈ 1 weekend) ✅ done (resume download, OG image, Lighthouse still open)
- `content/content.ts` filled from the resume
- Plain page: hero, parts inventory, 4 sets, experience timeline, origin story, certifications, contact
- Brick-flavoured styling (stud patterns, bold primary colours, booklet typography) without any 3D yet
- Resume PDF download, SEO metadata, Open Graph image, mobile layout
- **Done when:** a recruiter can read everything in 30 seconds on a phone; Lighthouse ≥ 95

### Phase 2: Technic machine backend (≈ 1–2 weekends) 🟡 built; answer eval waiting on Gemini capacity
- Build step: `content.ts` → chunks → Gemini embeddings → `corpus.json`
- FastAPI `/api/chat`: BM25 + dense fusion → LLM rerank → answer with citations, or abstain below a confidence threshold
- Streams a trace (retrieved chunks, scores, decision, latency, tokens) over SSE
- Guardrails: input length cap, prompt-injection isolation, per-IP rate limit, no answers outside the corpus, answers never cut off mid-sentence
- Small eval set (20–30 Q&A) with a script that scores it, so you can quote the number
- Plain 2D chat UI with trace panel on the plain page
- **Done when:** chat answers grounded questions, declines salary/off-topic ones, eval score reported

### Phase 3: Booklet cover + Set #01 in 3D (≈ 2–3 weekends)
- Lazy-loaded 3D canvas, "Tour / Read as page" toggle, auto-fallback to page on weak devices
- Brick primitives (procedural boxes + studs), camera rig, step navigation (Next / Prev / arrow keys)
- Cover box art scene
- Set #01 AegisOps: bricks assemble per step, check step at the end
- Deep links: `?set=aegisops&step=3`
- **Done when:** the tour runs smoothly on a laptop and falls back cleanly on a phone

### Phase 4: Technic machine visuals + remaining sets (ongoing)
- The chat as a 3D Technic machine: question brick moves along conveyors synced to the real trace events
- Sets #02–#04, parts inventory bins, origin story, back cover
- Optional: sound, physics, Easter eggs

---

## Folder layout (planned)

```
portfolio/
├── app/                 Next.js pages (plain page, layout)
├── components/          UI sections, chat panel
├── scene/               3D: bricks, sets, camera, tour
├── content/content.ts   single source of truth
├── api/                 FastAPI (Vercel Python function)
├── scripts/             build corpus, run eval
├── public/              resume PDF, images
└── PLAN.md
```

## Needed from Lokesh

- [x] Profile URLs
  - GitHub: https://github.com/lokeshbothra21
  - AegisOps: https://github.com/lokeshbothra21/aegisops
  - LinkedIn: https://www.linkedin.com/in/lokeshbothra/
  - LeetCode: https://leetcode.com/u/lokesh21bothra/
- [x] Employer names: Prescience Insilico Pvt Ltd and HashInclude can both be named
- [x] Only the RAG project from the current role is public; the other one stays off the site, corpus and repo
- [x] Metrics OK to publish
- [ ] Photo (optional; could be a brick minifig instead)
- [x] Gemini API key (Phase 2)
- [x] GitHub + Vercel accounts ready (Phase 0)
