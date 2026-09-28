# Lokesh Bothra · Portfolio

Brick-toy instruction-booklet portfolio, live at https://lokeshbothra.vercel.app.
See [PLAN.md](PLAN.md) for the concept and phases.

## Run locally

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest
echo "GEMINI_API_KEY=..." > .env.local

npm run api     # Python chat API on :8000 (loads .env.local via your shell)
npm run dev     # site on :3000, proxies /api to :8000
```

## 3D tour

`/tour` is an instruction-booklet tour built with React Three Fiber. Each set is its real architecture built from
bricks (`scene/diagrams.ts`): modules are labelled, clickable components (databases are cylinders, people are
minifigures), edges are conveyors with packets showing the data flow, and a module's `step` says which build step adds
it. The thing each check step catches (`rejectAt`) is thrown off the build. The build fails if a diagram doesn't fit
its content or modules overlap. The Technic machine page (`scene/Machine.tsx`) is driven by the live chat stream.

## Editing content

All content lives in `content/content.ts`. After editing it, rebuild the chat corpus and commit the result:

```bash
set -a; source .env.local; set +a
npm run corpus
```

The build fails if you forget.

## Chat ("Technic machine")

`api/chat.py` (FastAPI, Vercel Python function) streams Server-Sent Events:
retrieve (BM25 + Gemini embeddings, reciprocal rank fusion) → confidence gate (declines off-topic questions without an
LLM call) → grounded Gemini answer with citations (fails over across models, falls back to source passages when all are
busy) → deterministic verification of citations and numbers.

```bash
npm run test:api        # unit + pipeline tests with a fake Gemini
npm run eval -- --no-llm  # retrieval recall and gate accuracy
npm run eval            # plus answer checks (needs Gemini)
```
