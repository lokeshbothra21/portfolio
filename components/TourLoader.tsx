"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const Tour = dynamic(() => import("@/scene/Tour"), {
  ssr: false,
  loading: () => <Message title="Opening the box…" />,
});

type Check = "checking" | "ok" | "slow" | "no-webgl";

let detected: Check | null = null;

function detect(): Check {
  if (detected) return detected;
  detected = probe();
  return detected;
}

function probe(): Check {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!gl) return "no-webgl";
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory && nav.deviceMemory < 4) || navigator.hardwareConcurrency <= 2) return "slow";
  return "ok";
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border-4 border-ink bg-card p-6 text-center shadow-[6px_6px_0_var(--ink)]">
        <p className="font-display text-2xl font-black">{title}</p>
        {children}
      </div>
    </main>
  );
}

export function TourLoader() {
  const detectedCheck = useSyncExternalStore(
    () => () => {},
    detect,
    () => "checking" as Check,
  );
  const [tryAnyway, setTryAnyway] = useState(false);
  const check = tryAnyway ? "ok" : detectedCheck;

  if (check === "checking") return <Message title="Opening the box…" />;
  if (check === "no-webgl")
    return (
      <Message title="The 3D tour needs WebGL">
        <p className="mt-2 text-ink-soft">This browser can&apos;t show it, but everything is on the page view too.</p>
        <Link href="/" className="brick mt-5 inline-block rounded-lg bg-ink px-5 py-3 font-display font-bold text-white">
          Read as page
        </Link>
      </Message>
    );
  if (check === "slow")
    return (
      <Message title="This device may find the tour heavy">
        <p className="mt-2 text-ink-soft">The page view has everything and loads instantly.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/" className="brick rounded-lg bg-ink px-5 py-3 font-display font-bold text-white">
            Read as page
          </Link>
          <button type="button" onClick={() => setTryAnyway(true)} className="rounded-lg border-2 border-ink px-5 py-3 font-display font-bold">
            Try the tour
          </button>
        </div>
      </Message>
    );
  return <Tour />;
}
