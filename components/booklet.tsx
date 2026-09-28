// Small building blocks shared by the booklet sections.
import type { ReactNode } from "react";
import type { SkillBin } from "@/content/content";

export type BrickColour = SkillBin["colour"];

export const fill: Record<BrickColour, string> = {
  red: "var(--brick-red)",
  blue: "var(--brick-blue)",
  yellow: "var(--brick-yellow)",
  green: "var(--brick-green)",
  orange: "var(--brick-orange)",
  purple: "var(--brick-purple)",
};

export const bg: Record<BrickColour, string> = {
  red: "bg-brick-red text-white",
  blue: "bg-brick-blue text-white",
  yellow: "bg-brick-yellow text-ink",
  green: "bg-brick-green text-white",
  orange: "bg-brick-orange text-ink",
  purple: "bg-brick-purple text-white",
};

/** A side-on brick with studs on top. `studs` is the brick's length (2x4 → 4). */
export function Brick({ colour, studs = 4, className = "" }: { colour: BrickColour; studs?: number; className?: string }) {
  const unit = 20;
  const w = studs * unit;
  return (
    <svg viewBox={`0 0 ${w} 30`} className={className} aria-hidden="true">
      {Array.from({ length: studs }, (_, i) => (
        <g key={i}>
          <rect x={i * unit + 4} y={1} width={12} height={7} rx={1.5} fill={fill[colour]} />
          <rect x={i * unit + 4} y={1} width={12} height={7} rx={1.5} fill="black" opacity={0.12} />
          <rect x={i * unit + 5.5} y={2} width={4} height={2} rx={1} fill="white" opacity={0.35} />
        </g>
      ))}
      <rect x={0} y={7} width={w} height={23} rx={2} fill={fill[colour]} />
      <rect x={0} y={25} width={w} height={5} rx={2} fill="black" opacity={0.16} />
      <rect x={2} y={9} width={w - 4} height={2} rx={1} fill="white" opacity={0.25} />
    </svg>
  );
}

export function SectionHeading({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
  return (
    <header id={id} className="scroll-mt-24">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 max-w-2xl text-ink-soft">{children}</p>}
    </header>
  );
}

/** A tech "part", written like a parts-list entry: 1× FastAPI. */
export function Part({ name }: { name: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-md border border-ink/10 bg-card px-2 py-1 font-mono text-xs">
      <span className="text-ink-soft">1×</span>
      {name}
    </li>
  );
}

export function StudDivider() {
  return <div className="studs h-4 w-full text-line" aria-hidden="true" />;
}
