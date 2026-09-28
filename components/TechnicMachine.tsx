"use client";

import { SectionHeading } from "./booklet";
import { AnswerView, AskForm, TraceList, useAsk } from "./chat";

export function TechnicMachine() {
  const chat = useAsk();
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
            <AnswerView chat={chat} />
          </div>
          <AskForm chat={chat} id="question" />
        </div>

        <aside className="rounded-2xl bg-ink p-5 text-white" aria-label="Pipeline trace">
          <p className="mb-4 font-display text-sm font-extrabold uppercase tracking-wider">What just happened</p>
          <TraceList chat={chat} />
        </aside>
      </div>
    </section>
  );
}
