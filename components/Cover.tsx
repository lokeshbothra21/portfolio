import { profile, sets } from "@/content/content";
import { Brick } from "./booklet";

/** The booklet's front cover, styled like a toy box. */
export function Cover() {
  return (
    <section aria-labelledby="cover-title" className="overflow-hidden rounded-3xl border-4 border-ink bg-card shadow-[8px_8px_0_var(--ink)]">
      <div className="flex items-center justify-between gap-4 bg-brick-red px-5 py-3 text-white sm:px-8">
        <span className="font-display text-sm font-extrabold uppercase tracking-[0.25em]">Set 2026</span>
        <span className="font-mono text-xs sm:text-sm">
          {sets.length} sets inside · Ages 18+
        </span>
      </div>

      <div className="grid gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-center md:py-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brick-yellow px-3 py-1 font-display text-sm font-bold">
            {profile.title}
          </p>
          <h1 id="cover-title" className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            {profile.name.split(" ").map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl font-display text-xl font-bold sm:text-2xl">{profile.tagline}</p>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{profile.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/tour" className="brick rounded-lg bg-brick-yellow px-5 py-3 font-display font-bold text-ink transition hover:-translate-y-0.5">
              Take the 3D tour
            </a>
            <a href="#sets" className="brick rounded-lg bg-ink px-5 py-3 font-display font-bold text-white transition hover:-translate-y-0.5">
              Open the sets
            </a>
            {profile.resume && (
              <a href={profile.resume} download className="brick rounded-lg bg-brick-blue px-5 py-3 font-display font-bold text-white transition hover:-translate-y-0.5">
                Download resume
              </a>
            )}
            <a href={profile.links.github} className="rounded-lg border-2 border-ink px-5 py-3 font-display font-bold transition hover:bg-ink hover:text-white">
              GitHub
            </a>
          </div>
        </div>

        {/* Box art: a small stack of bricks, one per colour in the booklet. */}
        <div className="relative mx-auto w-full max-w-xs" aria-hidden="true">
          <div className="flex flex-col items-center">
            <Brick colour="yellow" studs={2} className="w-1/3" />
            <Brick colour="red" studs={4} className="-mt-[3%] w-2/3" />
            <div className="-mt-[3%] flex w-full">
              <Brick colour="blue" studs={4} className="w-1/2" />
              <Brick colour="green" studs={4} className="w-1/2" />
            </div>
            <Brick colour="orange" studs={8} className="-mt-[3%] w-full" />
          </div>
          <div className="absolute -right-2 -top-4 flex h-20 w-20 rotate-12 flex-col items-center justify-center rounded-full border-4 border-ink bg-brick-yellow text-center font-display leading-tight">
            <span className="text-2xl font-black">✓</span>
            <span className="text-[10px] font-extrabold uppercase">Checked build</span>
          </div>
        </div>
      </div>
    </section>
  );
}
