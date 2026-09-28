import { SectionHeading, StudDivider } from "@/components/booklet";
import { Cover } from "@/components/Cover";
import { BackCover, BonusPieces, Experience, Nav, Origin, PartsInventory } from "@/components/sections";
import { SetSpread } from "@/components/SetSpread";
import { profile, sets } from "@/content/content";

// The plain booklet page: everything a recruiter needs, no 3D required.
export default function Home() {
  return (
    <>
      <Nav />
      <main id="top" className="mx-auto w-full max-w-6xl flex-1 space-y-16 px-4 py-8 sm:space-y-20 sm:px-6 sm:py-12">
        <Cover />

        <section className="space-y-8">
          <SectionHeading id="sets" kicker={`${sets.length} sets in this box`} title="The builds">
            Each set shows how the system was put together, step by step. Every build ends with a check step, because the
            thing I care about most is AI that proves its own answers.
          </SectionHeading>
          <div className="space-y-8">
            {sets.map((set) => (
              <SetSpread key={set.id} set={set} />
            ))}
          </div>
        </section>

        <StudDivider />
        <PartsInventory />
        <StudDivider />
        <Experience />
        <Origin />
        <BonusPieces />
        <BackCover />
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 font-mono text-xs text-ink-soft sm:px-6">
        © {new Date().getFullYear()} {profile.name}. Brick-style illustrations are original and not affiliated with any toy brand.
      </footer>
    </>
  );
}
