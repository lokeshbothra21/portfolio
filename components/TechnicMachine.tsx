"use client";

import { useRef, useState } from "react";
import { SectionHeading } from "./booklet";

type Source = { n: number; id: string; title: string };
type Verify = { citations: number; numbers: number; unverified_numbers: string[]; invalid_citations: number[]; passed: boolean };
type Trace = {
  retrieve?: { ms: number; bm25: [string, number][]; dense: [string, number][]; fused: { id: string; title: string; score: number }[]; dense_available: boolean };
  gate?: { confident: boolean; max_dense: number; max_bm25: number };
  retries: { model: string }[];
  generate?: { ms: number; model: string | null; tokens?: number; fallback?: boolean; truncated?: boolean };
  verify?: Verify;
  done?: { ms: number; model: string | null; tokens: number; fallback: boolean };
};
type Passage = { n: number; title: string; text: string };
type Answer = { text: string; abstained: boolean; sources: Source[]; fallback?: boolean; passages?: Passage[] };

const SUGGESTIONS = [
  "Why should we hire Lokesh?",
  "How does AegisOps stop the LLM from making things up?",
  "How did he improve RAGAS answer correctness?",
  "What is your expected salary?",
];

async function* readEvents(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const event = block.match(/^event: (.*)$/m)?.[1];
      const data = block.match(/^data: (.*)$/m)?.[1];
      if (event && data) yield { event, data: JSON.parse(data) };
    }
  }
}

/** Plain text with URLs and email addresses made clickable. */
function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s,]+[^\s,.]|[\w.+-]+@[\w-]+\.[\w.]+[^\s,.])/).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} className="underline underline-offset-2 [overflow-wrap:anywhere]">
            {part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : /@/.test(part) && !/\s/.test(part) ? (
          <a key={i} href={`mailto:${part}`} className="underline underline-offset-2">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function WithCitations({ text, sources }: { text: string; sources: Source[] }) {
  const byN = Object.fromEntries(sources.map((s) => [s.n, s.title]));
  return (
    <>
      {text.split(/(\[\d+\])/).map((part, i) => {
        const n = part.match(/^\[(\d+)\]$/)?.[1];
        if (!n) return <span key={i}>{part}</span>;
        return (
          <sup key={i} title={byN[+n] ?? "Unknown source"} className="mx-0.5 rounded bg-callout px-1 font-mono text-[10px] font-bold text-ink">
            {n}
          </sup>
        );
      })}
    </>
  );
}

type StageState = "idle" | "active" | "done" | "skipped" | "warn";

function Stage({ label, state, children }: { label: string; state: StageState; children?: React.ReactNode }) {
  const dot = {
    idle: "bg-white/15",
    active: "animate-pulse bg-brick-yellow",
    done: "bg-brick-green",
    skipped: "bg-white/30",
    warn: "bg-brick-orange",
  }[state];
  return (
    <li className="relative pl-7">
      <span className={`absolute left-0 top-1 h-4 w-4 rounded-sm ${dot}`} aria-hidden="true" />
      <p className="font-display text-sm font-bold">
        {label}
        <span className="sr-only"> ({state})</span>
      </p>
      {children && <div className="mt-1 font-mono text-[11px] leading-relaxed text-white/70">{children}</div>}
    </li>
  );
}

export function TechnicMachine() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [trace, setTrace] = useState<Trace>({ retries: [] });
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    abort.current?.abort();
    abort.current = new AbortController();
    setAsked(text);
    setQuestion("");
    setBusy(true);
    setStreamed("");
    setAnswer(null);
    setTrace({ retries: [] });
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "The machine jammed. Please try again.");
      }
      for await (const { event, data } of readEvents(res)) {
        if (event === "token") setStreamed((s) => s + data.text);
        else if (event === "answer") setAnswer(data);
        else if (event === "retry") setTrace((t) => ({ ...t, retries: [...t.retries, data] }));
        else if (event === "error") throw new Error(data.message);
        else setTrace((t) => ({ ...t, [event]: data }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const t = trace;
  const started = busy || !!t.done;
  const stage = (reached: boolean, next: boolean): StageState => (reached ? "done" : started && busy && next ? "active" : "idle");
  const abstained = t.gate && !t.gate.confident;

  return (
    <section className="space-y-8">
      <SectionHeading id="machine" kicker="The Technic machine" title="Ask the booklet">
        Ask anything about my work. Your question runs through the same kind of pipeline I build for a living: hybrid
        retrieval, a confidence gate that declines off-topic questions, a grounded answer with citations, and a
        deterministic check that every number in the answer really is in the sources.
      </SectionHeading>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col rounded-2xl border-2 border-ink/80 bg-card p-5 sm:p-6">
          <div className="min-h-40 flex-1" aria-live="polite">
            {!asked && <p className="text-ink-soft">Pick a question or write your own. Answers come only from this site.</p>}
            {asked && (
              <>
                <p className="ml-auto w-fit max-w-[85%] rounded-xl bg-ink px-4 py-2.5 text-white">{asked}</p>
                <div className="mt-4 max-w-[92%] rounded-xl border border-line bg-paper px-4 py-3 leading-relaxed">
                  {answer ? (
                    <WithCitations text={answer.text} sources={answer.sources} />
                  ) : streamed ? (
                    <WithCitations text={streamed} sources={[]} />
                  ) : error ? null : (
                    <span className="text-ink-soft">Turning the gears…</span>
                  )}
                  {error && <span className="text-brick-red">{error}</span>}
                </div>
                {answer?.passages && (
                  <ul className="mt-3 max-w-[92%] space-y-2">
                    {answer.passages.map((p) => (
                      <li key={p.n} className="rounded-xl border-l-4 border-brick-blue bg-card px-4 py-3 text-sm leading-relaxed">
                        <p className="font-display font-bold">{p.title}</p>
                        <p className="mt-1 text-ink-soft">
                          <Linkified text={p.text} />
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {answer && answer.sources.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {answer.sources.map((s) => (
                      <li key={s.n} className="rounded-md border border-line bg-card px-2 py-1">
                        <span className="font-mono font-bold">{s.n}</span> {s.title}
                      </li>
                    ))}
                  </ul>
                )}
                {t.verify && (
                  <p className={`mt-3 text-sm font-semibold ${t.verify.passed ? "text-brick-green" : "text-brick-orange"}`}>
                    {t.verify.passed
                      ? `✓ Checked: ${t.verify.citations} citation${t.verify.citations === 1 ? "" : "s"} valid, ${t.verify.numbers} number${t.verify.numbers === 1 ? "" : "s"} found in the sources`
                      : `⚠ Couldn't verify ${[...t.verify.unverified_numbers, ...t.verify.invalid_citations.map((n) => `citation [${n}]`)].join(", ") || "citations"} against the sources`}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} disabled={busy} className="rounded-lg border-2 border-ink/80 px-3 py-1.5 text-left text-sm font-semibold hover:bg-ink hover:text-white disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label htmlFor="question" className="sr-only">
              Your question
            </label>
            <input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              placeholder="Ask about projects, skills, experience…"
              className="min-w-0 flex-1 rounded-lg border-2 border-ink/80 bg-white px-3 py-2.5 outline-none focus:border-brick-blue"
            />
            <button type="submit" disabled={busy || !question.trim()} className="brick rounded-lg bg-brick-blue px-5 font-display font-bold text-white disabled:opacity-50">
              Ask
            </button>
          </form>
        </div>

        <aside className="rounded-2xl bg-ink p-5 text-white" aria-label="Pipeline trace">
          <p className="font-display text-sm font-extrabold uppercase tracking-wider">What just happened</p>
          <ol className="mt-4 space-y-4">
            <Stage label="1 · Retrieve (BM25 + embeddings)" state={stage(!!t.retrieve, true)}>
              {t.retrieve && (
                <>
                  {t.retrieve.ms} ms{!t.retrieve.dense_available && " · embeddings unavailable, BM25 only"}
                  <br />
                  top: {t.retrieve.fused.slice(0, 3).map((f) => f.title).join(" · ")}
                </>
              )}
            </Stage>
            <Stage label="2 · Confidence gate" state={t.gate ? (t.gate.confident ? "done" : "warn") : stage(false, !!t.retrieve)}>
              {t.gate && (
                <>
                  similarity {t.gate.max_dense} (needs ≥ 0.62) → {t.gate.confident ? "answer" : "decline"}
                </>
              )}
            </Stage>
            <Stage label="3 · Grounded answer (Gemini)" state={abstained ? "skipped" : t.generate ? (t.generate.fallback ? "warn" : "done") : stage(false, !!t.gate)}>
              {abstained && "skipped, no LLM call needed"}
              {t.retries.length > 0 && `${t.retries.length} model${t.retries.length > 1 ? "s" : ""} busy, failed over · `}
              {t.generate && (t.generate.fallback ? "all models busy → quoting the site instead" : `${t.generate.model} · ${t.generate.ms} ms · ${t.generate.tokens} tokens`)}
            </Stage>
            <Stage label="4 · Verify citations and numbers" state={abstained || t.generate?.fallback ? "skipped" : t.verify ? (t.verify.passed ? "done" : "warn") : stage(false, !!t.generate)}>
              {t.generate?.fallback && "skipped, passages are quoted verbatim"}
              {t.verify && `${t.verify.citations} citations · ${t.verify.numbers} numbers · ${t.verify.passed ? "all checked" : "flagged"}`}
            </Stage>
          </ol>
          {t.done && <p className="mt-5 border-t border-white/15 pt-3 font-mono text-[11px] text-white/60">total {t.done.ms} ms</p>}
        </aside>
      </div>
    </section>
  );
}
