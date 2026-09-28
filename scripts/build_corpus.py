"""Build api/_data/corpus.json from api/_data/content.json.

Run after editing content/content.ts:
    npm run corpus
Embeddings are computed once here, so a chat request only embeds the question.
"""

import json
import sys
from pathlib import Path

from google import genai
from google.genai import types

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
from _rag import DATA, EMBED_DIM, EMBED_MODEL, build_chunks  # noqa: E402


def main() -> None:
    content = json.loads((DATA / "content.json").read_text())
    chunks = build_chunks(content)
    client = genai.Client()
    vectors = []
    for start in range(0, len(chunks), 50):
        batch = chunks[start : start + 50]
        res = client.models.embed_content(
            model=EMBED_MODEL,
            contents=[f"{c.title}\n{c.text}" for c in batch],
            config=types.EmbedContentConfig(output_dimensionality=EMBED_DIM, task_type="RETRIEVAL_DOCUMENT"),
        )
        vectors += [[round(v, 6) for v in e.values] for e in res.embeddings]
    out = {
        "model": EMBED_MODEL,
        "dim": EMBED_DIM,
        "chunks": [{"id": c.id, "title": c.title, "text": c.text, "embedding": v} for c, v in zip(chunks, vectors)],
    }
    (DATA / "corpus.json").write_text(json.dumps(out))
    print(f"embedded {len(chunks)} chunks -> {DATA / 'corpus.json'}")


if __name__ == "__main__":
    main()
