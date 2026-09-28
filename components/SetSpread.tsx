import type { BrickSet } from "@/content/content";
import { bg, Brick, fill, Part } from "./booklet";

/** One project, laid out like a two-page spread of a building manual. */
export function SetSpread({ set }: { set: BrickSet }) {
  return (
    <article id={`set-${set.id}`} className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-ink/80 bg-card">
      <header className="flex flex-wrap items-start gap-4 border-b-2 border-ink/10 p-5 sm:p-7">
        <div className={`brick flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg ${bg[set.colour]}`}>
          <span className="font-mono text-[10px] uppercase opacity-80">Set</span>
          <span className="font-display text-2xl font-black leading-none">{set.number}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{set.name}</h3>
            {set.flagship && <span className="rounded-full bg-brick-yellow px-2.5 py-0.5 font-display text-xs font-bold">Flagship</span>}
          </div>
          <p className="mt-1 font-display text-lg font-medium">{set.tagline}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft">{set.context}</p>
        </div>
      </header>

      <div className="p-5 sm:p-7">
        <p className="max-w-3xl leading-relaxed text-ink-soft">{set.summary}</p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {set.metrics.map((m) => (
            <div key={m.label} className="flex flex-col rounded-xl border border-line border-l-8 bg-paper p-4" style={{ borderLeftColor: fill[set.colour] }}>
              <dt className="order-2 mt-1 text-sm text-ink-soft">{m.label}</dt>
              <dd className="font-display text-2xl font-black">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
          <ol className="space-y-3" aria-label={`Build steps for ${set.name}`}>
            {set.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-xl border border-line p-4">
                <span className="w-7 shrink-0 font-display text-3xl font-black leading-none text-ink/80">{i + 1}</span>
                <div>
                  <p className="font-display font-bold">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.detail}</p>
                </div>
              </li>
            ))}
            <li className="flex gap-4 rounded-xl border-2 border-brick-green bg-brick-green/5 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brick-green font-black text-white" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="font-display font-bold">
                  <span className="sr-only">Check step: </span>
                  {set.check.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{set.check.detail}</p>
              </div>
            </li>
          </ol>

          <aside className="h-fit rounded-xl bg-callout p-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-extrabold uppercase tracking-wider">Parts</p>
              <Brick colour={set.colour} studs={2} className="w-8" />
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {set.parts.map((p) => (
                <Part key={p} name={p} />
              ))}
            </ul>
            {set.links && (
              <div className="mt-4 flex flex-wrap gap-2">
                {set.links.map((l) => (
                  <a key={l.href} href={l.href} className="rounded-lg bg-ink px-3 py-2 font-display text-sm font-bold text-white hover:bg-ink/85">
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}
