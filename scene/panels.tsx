"use client";

// Booklet panels shown over the 3D scene. All text lives here, not in the canvas,
// so it stays sharp, selectable and readable by screen readers.
import { bg, Part } from "@/components/booklet";
import { profile, sets, type BrickSet } from "@/content/content";

export function PanelCover({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
        Set 2026 · {sets.length} sets inside · Ages 18+
      </p>
      <h1 className="mt-2 font-display text-4xl font-black leading-none tracking-tight">{profile.name}</h1>
      <p className="mt-2 inline-block rounded-full bg-brick-yellow px-2.5 py-0.5 font-display text-sm font-bold">{profile.title}</p>
      <p className="mt-3 font-display text-lg font-bold leading-snug">{profile.tagline}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        This booklet builds each of my projects step by step. Every build ends with a check step, because I build AI that
        proves its own answers. Drag to look around.
      </p>
      <button type="button" onClick={onStart} className="brick mt-4 w-full rounded-lg bg-ink px-4 py-3 font-display font-bold text-white">
        Start building →
      </button>
    </div>
  );
}

export function PanelSet({ set, step, steps, onStep }: { set: BrickSet; step: number; steps: number; onStep: (s: number) => void }) {
  const isIntro = step === 0;
  const isCheck = step === steps - 1;
  const content = isIntro ? null : isCheck ? set.check : set.steps[step - 1];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`brick flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${bg[set.colour]}`}>
          <span className="font-mono text-[9px] uppercase opacity-80">Set</span>
          <span className="font-display text-xl font-black leading-none">{set.number}</span>
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-extrabold">{set.name}</h2>
          <p className="truncate text-sm text-ink-soft">{set.tagline}</p>
        </div>
      </div>

      <ol className="mt-4 flex gap-1" aria-label="Build steps">
        {Array.from({ length: steps }, (_, i) => (
          <li key={i} className="flex-1">
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-label={i === 0 ? "Box contents" : i === steps - 1 ? "Check step" : `Step ${i}`}
              aria-current={i === step ? "step" : undefined}
              className={`block h-2 w-full rounded-sm ${i <= step ? (i === steps - 1 ? "bg-brick-green" : "bg-ink") : "bg-ink/15"}`}
            />
          </li>
        ))}
      </ol>

      <div className="mt-4 min-h-32" aria-live="polite">
        {isIntro && (
          <>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">Box contents · {set.context}</p>
            <p className="mt-2 text-sm leading-relaxed">{set.summary}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {set.parts.map((p) => (
                <Part key={p} name={p} />
              ))}
            </ul>
          </>
        )}
        {content && !isCheck && (
          <div className="flex gap-3">
            <span className="font-display text-5xl font-black leading-none">{step}</span>
            <div>
              <p className="font-display text-lg font-bold">{content.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{content.detail}</p>
            </div>
          </div>
        )}
        {content && isCheck && (
          <div className="rounded-xl border-2 border-brick-green bg-brick-green/5 p-3">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brick-green text-white" aria-hidden="true">
                ✓
              </span>
              {content.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{content.detail}</p>
            <dl className="mt-3 grid gap-2">
              {set.metrics.map((m) => (
                <div key={m.label} className="flex items-baseline gap-2">
                  <dd className="shrink-0 whitespace-nowrap font-display text-lg font-black">{m.value}</dd>
                  <dt className="text-xs text-ink-soft">{m.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-soft">{isIntro ? "Box contents" : isCheck ? "Check step" : `Step ${step} of ${steps - 2}`}</span>
        {set.links?.map((l) => (
          <a key={l.href} href={l.href} className="rounded-md bg-ink px-2.5 py-1 font-display text-xs font-bold text-white">
            {l.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

export function PanelBack() {
  const contacts = [
    { label: "Email", href: `mailto:${profile.email}`, c: "red" as const },
    { label: "LinkedIn", href: profile.links.linkedin, c: "blue" as const },
    { label: "GitHub", href: profile.links.github, c: "green" as const },
    { label: "LeetCode", href: profile.links.leetcode, c: "orange" as const },
  ];
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Back cover</p>
      <h2 className="mt-2 font-display text-3xl font-black">Let&apos;s build something.</h2>
      <p className="mt-2 text-sm text-ink-soft">{profile.availability}</p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {contacts.map((c) => (
          <li key={c.label}>
            <a href={c.href} className={`brick block rounded-lg px-3 py-2.5 text-center font-display font-bold ${bg[c.c]}`}>
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
