import { profile, sets } from "@/content/content";

// Phase 0 placeholder. Replaced by the plain booklet page in Phase 1.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">
        Set 2026 · {sets.length} sets inside · under construction
      </p>
      <h1 className="text-5xl font-bold tracking-tight">{profile.name}</h1>
      <p className="text-xl text-zinc-600">
        {profile.title}. {profile.tagline}
      </p>
      <nav className="flex flex-wrap gap-4 text-sm font-medium underline underline-offset-4">
        <a href={profile.links.github}>GitHub</a>
        <a href={profile.links.linkedin}>LinkedIn</a>
        <a href={profile.links.leetcode}>LeetCode</a>
        <a href={`mailto:${profile.email}`}>Email</a>
      </nav>
    </main>
  );
}
