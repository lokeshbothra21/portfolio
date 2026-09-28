"""Retrieval core for the portfolio's "Technic machine" chat.

The corpus is a few KB, so everything runs in memory: BM25 and dense search
are fused with reciprocal rank fusion, a confidence gate decides whether to
answer at all, and deterministic checks verify the answer's citations and
numbers against the retrieved passages.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

DATA = Path(__file__).parent / "_data"
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIM = 768

# Gate thresholds, tuned on on-topic vs off-topic questions (see scripts/eval.py).
# Dense similarity separates them cleanly (on >= 0.637, off <= 0.609); BM25 alone
# does not, so it only gates when the embedding call is unavailable.
MIN_DENSE = 0.62
MIN_BM25 = 2.5
TOP_K = 6

STOPWORDS = set(
    "a an and are as at be by did do does for from has have he her him his how i in is it its me my of on or "
    "that the their them this to was what when where which who why will with you your about tell can".split()
)


@dataclass
class Chunk:
    id: str
    title: str
    text: str
    embedding: list[float] | None = None


def tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9][a-z0-9+#.\-]*", text.lower()) if t not in STOPWORDS]


# ---------------------------------------------------------------- chunking


def build_chunks(content: dict) -> list[Chunk]:
    """Turn the site content into small, self-describing passages."""
    p = content["profile"]
    chunks = [
        Chunk(
            "profile",
            "About Lokesh",
            f"{p['name']} is an {p['title']} based in {p['location']}. In his own words: \"{p['tagline']} {p['intro']}\"",
        ),
        Chunk(
            "contact",
            "Contact",
            f"Contact {p['name']} by email at {p['email']}. LinkedIn: {p['links']['linkedin']}. "
            f"GitHub: {p['links']['github']}. LeetCode: {p['links']['leetcode']}. {p['availability']}",
        ),
    ]
    for s in content["sets"]:
        name = s["name"]
        metrics = "; ".join(f"{m['value']} {m['label']}" for m in s["metrics"])
        links = " ".join(f"{link['label']}: {link['href']}" for link in s.get("links", []))
        chunks.append(
            Chunk(
                f"set:{s['id']}",
                f"Set #{s['number']} {name}",
                f"Project {name} ({s['tagline']}, {s['context']}). {s['summary']} "
                f"Results: {metrics}. Built with: {', '.join(s['parts'])}. {links}".strip(),
            )
        )
        for i, step in enumerate(s["steps"], 1):
            chunks.append(Chunk(f"set:{s['id']}:step{i}", f"{name}: {step['title']}", f"{name}, {step['title']}: {step['detail']}"))
        c = s["check"]
        chunks.append(Chunk(f"set:{s['id']}:check", f"{name}: {c['title']}", f"{name}, check step, {c['title']}: {c['detail']}"))
    for r in content["experience"]:
        chunks.append(
            Chunk(
                f"role:{r['org']}",
                f"{r['title']} at {r['org']}",
                f"{r['title']} at {r['org']}, {r['location']}, {r['start']} to {r['end']}. {r['summary']}",
            )
        )
    o = content["origin"]
    chunks.append(Chunk("origin", o["title"], f"{o['title']} ({o['period']}, {o['org']}, {o['location']}). In his own words: \"{o['story']}\""))
    for b in content["skills"]:
        chunks.append(Chunk(f"skills:{b['name']}", f"Skills: {b['name']}", f"{b['name']} skills: {', '.join(b['parts'])}."))
    certs = "; ".join(f"{c['name']} ({c['issuer']}, {c['year']})" for c in content["certifications"])
    chunks.append(Chunk("certifications", "Certifications", f"Certifications: {certs}."))
    edu = "; ".join(f"{e['name']}, {e['school']}, {e['years']}{', ' + e['note'] if e['note'] else ''}" for e in content["education"])
    chunks.append(Chunk("education", "Education", f"Education: {edu}."))
    return chunks


def load_corpus() -> list[Chunk]:
    raw = json.loads((DATA / "corpus.json").read_text())
    return [Chunk(**c) for c in raw["chunks"]]


# ---------------------------------------------------------------- retrieval


class BM25:
    def __init__(self, docs: list[list[str]], k1: float = 1.4, b: float = 0.75):
        self.docs, self.k1, self.b = docs, k1, b
        self.avg = sum(map(len, docs)) / len(docs)
        df = Counter(t for d in docs for t in set(d))
        n = len(docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}
        self.tf = [Counter(d) for d in docs]

    def scores(self, query: list[str]) -> list[float]:
        out = []
        for d, tf in zip(self.docs, self.tf):
            s = 0.0
            for t in query:
                if t in tf:
                    f = tf[t]
                    s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(d) / self.avg))
            out.append(s)
        return out


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


@dataclass
class Hit:
    chunk: Chunk
    bm25: float
    dense: float
    fused: float


@dataclass
class Retrieval:
    hits: list[Hit]
    bm25_top: list[tuple[str, float]]
    dense_top: list[tuple[str, float]]
    max_bm25: float
    max_dense: float

    @property
    def confident(self) -> bool:
        if self.dense_top:
            return self.max_dense >= MIN_DENSE
        return self.max_bm25 >= MIN_BM25


class Retriever:
    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks
        self.bm25 = BM25([tokenize(f"{c.title} {c.text}") for c in chunks])

    def search(self, question: str, query_embedding: list[float] | None, k: int = TOP_K, rrf_k: int = 60) -> Retrieval:
        bm = self.bm25.scores(tokenize(question))
        dn = [cosine(query_embedding, c.embedding) if query_embedding and c.embedding else 0.0 for c in self.chunks]
        idx = range(len(self.chunks))
        bm_rank = sorted(idx, key=lambda i: -bm[i])
        dn_rank = sorted(idx, key=lambda i: -dn[i])
        fused = Counter()
        for rank, i in enumerate(bm_rank):
            if bm[i] > 0:
                fused[i] += 1 / (rrf_k + rank + 1)
        if query_embedding:
            for rank, i in enumerate(dn_rank):
                fused[i] += 1 / (rrf_k + rank + 1)
        top = [i for i, _ in fused.most_common(k)]
        return Retrieval(
            hits=[Hit(self.chunks[i], bm[i], dn[i], fused[i]) for i in top],
            bm25_top=[(self.chunks[i].id, round(bm[i], 2)) for i in bm_rank[:3] if bm[i] > 0],
            dense_top=[(self.chunks[i].id, round(dn[i], 3)) for i in dn_rank[:3]] if query_embedding else [],
            max_bm25=max(bm, default=0.0),
            max_dense=max(dn, default=0.0),
        )


# ---------------------------------------------------------------- verification

CITATION = re.compile(r"\[(\d+)\]")
NUMBER = re.compile(r"(?<![\w.])\d+(?:\.\d+)?%?")


def verify(answer: str, hits: list[Hit]) -> dict:
    """Deterministic checks: citations point at real passages, and every number
    in the answer appears in the passages it came from."""
    cited = sorted({int(n) for n in CITATION.findall(answer)})
    valid = [n for n in cited if 1 <= n <= len(hits)]
    used = [hits[n - 1] for n in valid] or hits
    source = " ".join(f"{h.chunk.title} {h.chunk.text}" for h in used)
    prose = CITATION.sub("", answer)
    numbers = sorted(set(NUMBER.findall(prose)))
    unverified = [n for n in numbers if not re.search(rf"(?<![\d.]){re.escape(n.rstrip('%'))}(?![\d])", source)]
    return {
        "citations": len(cited),
        "invalid_citations": [n for n in cited if n not in valid],
        "numbers": len(numbers),
        "unverified_numbers": unverified,
        "passed": bool(valid) and not unverified and len(valid) == len(cited),
    }


def trim_to_sentence(text: str) -> str:
    """Never show an answer cut off mid-sentence."""
    text = text.rstrip()
    ends = list(re.finditer(r"(?:[!?]|\.(?!\d))(?:\s*\[\d+\])*(?=\s|$)", text))
    if not ends or ends[-1].end() == len(text):
        return text
    return text[: ends[-1].end()]
