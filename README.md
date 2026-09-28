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

`/tour` is an instruction-booklet tour built with React Three Fiber. Builds live in `scene/builds.ts`: each set has one
step per content step, plus an intro and a check step (the build fails if they drift apart). Bricks drop in per step;
bricks listed in a step's `reject` are thrown off by the verifier. The Technic machine page (`scene/Machine.tsx`) is
driven by the live chat stream.

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
