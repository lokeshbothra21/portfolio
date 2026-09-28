import { certifications, education, experience, origin, profile, sets, skills } from "@/content/content";
import { bg, Brick, SectionHeading } from "./booklet";

const setName = Object.fromEntries(sets.map((s) => [s.id, `Set #${s.number} ${s.name}`]));

export function Nav() {
  const links = [
    ["Sets", "#sets"],
    ["Ask", "#machine"],
    ["Parts", "#parts"],
    ["Experience", "#experience"],
    ["Contact", "#contact"],
  ];
  return (
    <nav aria-label="Booklet" className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <a href="#top" className="brick mr-auto shrink-0 rounded-md bg-ink px-3 py-1.5 font-display text-sm font-extrabold uppercase tracking-widest text-white">
          LB
        </a>
        <ul className="flex gap-1 overflow-x-auto text-sm font-semibold">
          {links.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="block rounded-md px-2.5 py-1.5 hover:bg-ink/5 sm:px-3">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Skills as sorted brick bins, like the parts inventory at the back of a manual. */
export function PartsInventory() {
  const total = skills.reduce((n, bin) => n + bin.parts.length, 0);
  return (
    <section className="space-y-8">
      <SectionHeading id="parts" kicker={`Parts inventory · ${total} pieces`} title="What I build with" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((bin) => (
          <div key={bin.name} className="rounded-2xl border-2 border-ink/80 bg-card p-5">
            <div className="flex items-center gap-3">
              <Brick colour={bin.colour} studs={2} className="w-10" />
              <h3 className="font-display text-lg font-extrabold">{bin.name}</h3>
              <span className="ml-auto font-mono text-xs text-ink-soft">{bin.parts.length} pcs</span>
            </div>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {bin.parts.map((p) => (
                <li key={p} className={`brick rounded-md px-2.5 py-1 text-sm font-semibold ${bg[bin.colour]}`}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section className="space-y-8">
      <SectionHeading id="experience" kicker="Build log" title="Experience" />
      <ol className="relative space-y-6 border-l-4 border-ink/15 pl-6 sm:pl-8">
        {experience.map((role) => (
          <li key={role.org} className="relative">
            <span className="absolute -left-[34px] top-1.5 h-4 w-4 rounded-sm bg-brick-red ring-4 ring-paper sm:-left-[42px]" aria-hidden="true" />
            <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
              {role.start} – {role.end}
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold">{role.title}</h3>
            <p className="font-medium">
              {role.org} · <span className="text-ink-soft">{role.location}</span>
            </p>
            <p className="mt-2 max-w-2xl text-ink-soft">{role.summary}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {role.sets.map((id) => (
                <li key={id}>
                  <a href={`#set-${id}`} className="rounded-md border border-ink/20 px-2.5 py-1 font-mono text-xs hover:bg-ink hover:text-white">
                    {setName[id]} →
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Origin() {
  return (
    <section className="grid gap-6 rounded-2xl bg-brick-yellow p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-ink bg-card font-display text-4xl font-black" aria-hidden="true">
        #00
      </div>
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">
          {origin.period} · {origin.org}, {origin.location}
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">{origin.title}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed">{origin.story}</p>
      </div>
    </section>
  );
}

export function BonusPieces() {
  return (
    <section className="space-y-8">
      <SectionHeading id="bonus" kicker="Bonus pieces" title="Certifications and education" />
      <div className="grid gap-4 md:grid-cols-2">
        <ul className="space-y-3">
          {certifications.map((c) => (
            <li key={c.name} className="flex items-center gap-4 rounded-xl border-2 border-ink/80 bg-card p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-ink bg-brick-yellow font-display text-sm font-black">
                {c.year.slice(2)}
              </span>
              <div>
                <p className="font-display font-bold">{c.name}</p>
                <p className="text-sm text-ink-soft">
                  {c.issuer} · {c.year}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {education.map((e) => (
            <li key={e.name} className="rounded-xl border border-line bg-card p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">{e.years}</p>
              <p className="mt-1 font-display font-bold">{e.name}</p>
              <p className="text-sm text-ink-soft">
                {e.school}
                {e.note && ` · ${e.note}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BackCover() {
  const contacts = [
    { label: "Email", value: profile.email, href: `mailto:${profile.email}`, colour: "red" as const },
    { label: "LinkedIn", value: "in/lokeshbothra", href: profile.links.linkedin, colour: "blue" as const },
    { label: "GitHub", value: "lokeshbothra21", href: profile.links.github, colour: "green" as const },
    { label: "LeetCode", value: "lokesh21bothra", href: profile.links.leetcode, colour: "orange" as const },
  ];
  return (
    <section id="contact" className="scroll-mt-24 rounded-3xl bg-ink p-6 text-white sm:p-10">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Back cover</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Let&apos;s build something.</h2>
      <p className="mt-3 max-w-xl text-white/75">
        {profile.availability} Based in {profile.location}.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {contacts.map((c) => (
          <li key={c.label}>
            <a href={c.href} className={`brick flex items-center justify-between gap-3 rounded-xl px-5 py-4 transition hover:-translate-y-0.5 ${bg[c.colour]}`}>
              <span className="font-display text-lg font-extrabold">{c.label}</span>
              <span className="truncate font-mono text-sm opacity-90">{c.value}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
