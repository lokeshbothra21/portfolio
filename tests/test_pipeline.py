import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))
import chat  # noqa: E402
from _rag import BM25, Chunk, Hit, tokenize, trim_to_sentence, verify  # noqa: E402


def collect(question):
    async def go():
        return [e async for e in chat.run(question)]

    return asyncio.run(go())


class FakeStream:
    def __init__(self, pieces, fail_first=0):
        self.pieces, self.fail_first, self.calls = pieces, fail_first, []

    async def generate_content_stream(self, model, contents, config):
        self.calls.append(model)
        if len(self.calls) <= self.fail_first:
            raise RuntimeError("503 UNAVAILABLE")

        async def gen():
            for p in self.pieces:
                yield SimpleNamespace(text=p, usage_metadata=SimpleNamespace(total_token_count=42), candidates=None)

        return gen()


@pytest.fixture
def fake(monkeypatch):
    def install(pieces, fail_first=0, on_topic=True):
        chat._cooldown.clear()
        models = FakeStream(pieces, fail_first)
        monkeypatch.setattr(chat, "client", lambda: SimpleNamespace(aio=SimpleNamespace(models=models)))
        # Reuse a real corpus vector so dense similarity is realistic without an API call.
        target = next(c for c in chat.retriever.chunks if c.id == "set:aegisops")
        vec = target.embedding if on_topic else [0.0] * len(target.embedding)

        async def embed(_q):
            return vec

        monkeypatch.setattr(chat, "embed", embed)
        return models

    return install


def events(evts, name):
    return [d for e, d in evts if e == name]


# ------------------------------------------------------------ retrieval core


def test_tokenize_keeps_tech_terms():
    assert tokenize("What about C++ and pgvector?") == ["c++", "pgvector"]


def test_bm25_ranks_matching_doc_first():
    bm = BM25([tokenize("FAISS and BM25 hybrid search"), tokenize("Docker and Kubernetes")])
    s = bm.scores(tokenize("hybrid search"))
    assert s[0] > s[1] == 0


def test_verify_catches_invented_numbers_and_bad_citations():
    hits = [Hit(Chunk("a", "AegisOps", "opened an incident 57 s after fault injection"), 0, 0, 0)]
    assert verify("It opened an incident in 57 s [1].", hits)["passed"]
    bad = verify("It opened an incident in 5 s [1] with 99% accuracy [2].", hits)
    assert bad["unverified_numbers"] == ["5", "99%"] and bad["invalid_citations"] == [2] and not bad["passed"]


def test_trim_never_cuts_mid_sentence_or_mid_decimal():
    assert trim_to_sentence("Built X [1]. Also JWT, OAuth 2.0,") == "Built X [1]."
    assert trim_to_sentence("Improved 0.68 to 0.79 [2].") == "Improved 0.68 to 0.79 [2]."


# ------------------------------------------------------------ pipeline


def test_off_topic_abstains_without_calling_llm(fake):
    models = fake(["should not be used"], on_topic=False)
    evts = collect("What is your expected salary?")
    assert events(evts, "gate")[0]["confident"] is False
    assert events(evts, "answer")[0]["abstained"] is True
    assert models.calls == []


def test_grounded_answer_streams_and_verifies(fake):
    fake(["Lokesh built AegisOps, which opened an ", "incident 57 s after fault injection [1]."])
    evts = collect("Tell me about AegisOps")
    assert "".join(d["text"] for d in events(evts, "token")).endswith("[1].")
    assert events(evts, "answer")[0]["abstained"] is False
    assert events(evts, "done")[0]["model"] == chat.MODELS[0]


def test_sentinel_is_never_streamed_and_becomes_abstain(fake):
    fake(["NOT_", "IN_CONTEXT"])
    evts = collect("Tell me about AegisOps")
    assert events(evts, "token") == []
    assert events(evts, "answer")[0]["abstained"] is True


def test_text_held_back_as_possible_sentinel_is_not_lost(fake):
    fake(["N", "o, Lokesh built AegisOps [1]."])
    evts = collect("Tell me about AegisOps")
    assert "".join(d["text"] for d in events(evts, "token")) == "No, Lokesh built AegisOps [1]."


def test_falls_back_to_next_model_then_to_passages(fake):
    models = fake(["Lokesh built AegisOps [1]."], fail_first=1)
    evts = collect("Tell me about AegisOps")
    assert len(events(evts, "retry")) == 1 and events(evts, "done")[0]["model"] == models.calls[1]

    fake(["unused"], fail_first=99)
    evts = collect("Tell me about AegisOps")
    answer = events(evts, "answer")[0]
    assert events(evts, "done")[0]["fallback"] is True and answer["fallback"] is True
    assert 1 <= len(answer["passages"]) <= chat.FALLBACK_PASSAGES
    assert all(p["text"] in {c.text for c in chat.retriever.chunks} for p in answer["passages"])  # verbatim quotes
    assert events(evts, "verify") == []  # nothing generated, nothing to verify


def test_rate_limit(monkeypatch):
    monkeypatch.setattr(chat, "RATE_LIMIT", (2, 60))
    chat._hits.clear()
    assert [chat.rate_limited("1.2.3.4") for _ in range(3)] == [False, False, True]


def test_failed_models_are_skipped_during_cooldown(fake):
    models = fake(["unused"], fail_first=99)
    collect("Tell me about AegisOps")
    assert len(models.calls) == len(chat.MODELS)
    models.calls.clear()
    evts = collect("Tell me about AegisOps")  # same busy period: no model is called again
    assert models.calls == [] and events(evts, "done")[0]["fallback"] is True


def test_corpus_matches_content():
    """Fails if content changed without `npm run corpus`."""
    import json

    from _rag import DATA, build_chunks, load_corpus

    expected = [(c.id, c.text) for c in build_chunks(json.loads((DATA / "content.json").read_text()))]
    assert [(c.id, c.text) for c in load_corpus()] == expected, "run `npm run corpus`"
