"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { profile, sets, type BrickSet } from "@/content/content";
import { BuildScene } from "./BuildScene";
import { cover, setBuilds, type Build } from "./builds";
import { PanelBack, PanelCover, PanelSet } from "./panels";

type Page = { id: string; label: string; build?: Build; set?: BrickSet };

const PAGES: Page[] = [
  { id: "cover", label: "Cover", build: cover },
  ...sets.filter((s) => setBuilds[s.id]).map((s) => ({ id: s.id, label: `Set #${s.number} ${s.name}`, build: setBuilds[s.id], set: s })),
  { id: "back", label: "Back cover", build: cover },
];

function readUrl(): { page: number; step: number } {
  const q = new URLSearchParams(window.location.search);
  const page = Math.max(0, PAGES.findIndex((p) => p.id === q.get("page")));
  const max = (PAGES[page].build?.steps.length ?? 1) - 1;
  const step = Math.min(Math.max(0, Number(q.get("step")) || 0), max);
  return { page, step };
}

/** Eases the camera to each page's viewpoint, then hands control to the visitor. */
function CameraRig({ build }: { build: Build }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const moving = useRef(true);
  const goal = useMemo(() => {
    const off = new THREE.Vector3(build.base.w / 2, 0, build.base.d / 2);
    return {
      position: new THREE.Vector3(...build.camera.position).sub(off),
      target: new THREE.Vector3(...build.camera.target).sub(off),
    };
  }, [build]);

  useEffect(() => {
    moving.current = true;
    const stop = () => (moving.current = false);
    controls?.addEventListener("start", stop);
    return () => controls?.removeEventListener("start", stop);
  }, [goal, controls]);

  useFrame((_, dt) => {
    if (!moving.current || !controls) return;
    const k = 1 - Math.exp(-dt * 3);
    camera.position.lerp(goal.position, k);
    controls.target.lerp(goal.target, k);
    controls.update();
    if (camera.position.distanceTo(goal.position) < 0.02) moving.current = false;
  });
  return null;
}

/**
 * Frames the build in the part of the screen the panel doesn't cover: a lens
 * shift right on desktop (panel on the left), up on phones (panel at the bottom),
 * and a wider pull-back on narrow screens.
 */
function ViewShift() {
  const get = useThree((s) => s.get);
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const desktop = width >= 640;
    const dx = desktop ? Math.min(210, width * 0.16) : 0;
    const dy = desktop ? 0 : height * 0.2;
    camera.setViewOffset(width, height, -dx, dy, width, height);
    camera.zoom = width / height < 0.8 ? Math.max(0.42, (width / height) * 0.9) : 1;
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    };
  }, [get, width, height]);
  return null;
}

export default function Tour() {
  // The tour only ever renders in the browser (loaded with ssr: false), so it can read the URL up front.
  const [{ page, step }, setPos] = useState(readUrl);
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const current = PAGES[page];
  const steps = current.build?.steps.length ?? 1;

  useEffect(() => {
    const q = new URLSearchParams({ page: current.id });
    if (step) q.set("step", String(step));
    window.history.replaceState(null, "", `?${q}`);
  }, [current.id, step]);

  const goPage = useCallback((p: number) => setPos({ page: Math.min(Math.max(p, 0), PAGES.length - 1), step: 0 }), []);
  const next = useCallback(() => {
    setPos(({ page, step }) => {
      const n = PAGES[page].build?.steps.length ?? 1;
      if (step < n - 1) return { page, step: step + 1 };
      return page < PAGES.length - 1 ? { page: page + 1, step: 0 } : { page, step };
    });
  }, []);
  const prev = useCallback(() => {
    setPos(({ page, step }) => {
      if (step > 0) return { page, step: step - 1 };
      if (page === 0) return { page, step };
      return { page: page - 1, step: (PAGES[page - 1].build?.steps.length ?? 1) - 1 };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,#fff8e6,#f1e6cf_55%,#e2d3b3)]">
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 10, 26] }} aria-hidden="true">
        <hemisphereLight args={["#fff6e0", "#8a7a60", 0.9]} />
        <directionalLight
          position={[10, 18, 12]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-12, 8, -6]} intensity={0.6} color="#cfe3ff" />
        {current.build && <BuildScene key={current.id} build={current.build} step={step} instant={reducedMotion} />}
        {current.build && <CameraRig build={current.build} />}
        <ViewShift />
        <OrbitControls makeDefault enablePan={false} enableDamping minDistance={10} maxDistance={40} maxPolarAngle={Math.PI * 0.46} />
      </Canvas>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <Link href="/" className="brick pointer-events-auto rounded-md bg-ink px-3 py-1.5 font-display text-sm font-extrabold uppercase tracking-widest text-white">
          {profile.name}
        </Link>
        <div className="pointer-events-auto flex rounded-lg border-2 border-ink bg-card p-1 font-display text-sm font-bold">
          <span className="rounded-md bg-brick-blue px-3 py-1.5 text-white" aria-current="page">
            Tour
          </span>
          <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-ink/5">
            Read as page
          </Link>
        </div>
      </div>

      {/* Page panel */}
      <div className="pointer-events-none absolute inset-x-3 bottom-20 sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-20 sm:w-[380px]">
        <div className="pointer-events-auto max-h-[46vh] overflow-y-auto rounded-2xl border-2 border-ink bg-card/95 p-5 shadow-[5px_5px_0_var(--ink)] backdrop-blur sm:max-h-[calc(100vh-11rem)]">
          {current.id === "cover" && <PanelCover onStart={next} />}
          {current.set && <PanelSet set={current.set} step={step} steps={steps} onStep={(s) => setPos({ page, step: s })} />}
          {current.id === "back" && <PanelBack />}
        </div>
      </div>

      {/* Bottom bar */}
      <nav aria-label="Tour pages" className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4">
        <div className="flex max-w-full items-center gap-2 rounded-xl bg-ink/90 p-2 text-white backdrop-blur">
          <button type="button" onClick={prev} disabled={page === 0 && step === 0} className="rounded-lg border border-white/25 px-3 py-2 font-display text-sm font-bold disabled:opacity-40">
            ‹ <span className="hidden sm:inline">Back</span>
          </button>
          <ol className="flex items-center gap-1.5 px-1">
            {PAGES.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => goPage(i)}
                  aria-label={p.label}
                  aria-current={i === page ? "step" : undefined}
                  className={`block h-3 rounded-sm transition-all ${i === page ? "w-6 bg-brick-yellow" : "w-3 bg-white/35 hover:bg-white/60"}`}
                />
              </li>
            ))}
          </ol>
          <span className="hidden min-w-0 truncate px-2 font-mono text-xs text-white/80 sm:block">
            {page + 1}/{PAGES.length} · {current.label}
          </span>
          <button type="button" onClick={next} disabled={page === PAGES.length - 1 && step === steps - 1} className="rounded-lg bg-brick-yellow px-4 py-2 font-display text-sm font-extrabold text-ink disabled:opacity-40">
            Next ›
          </button>
        </div>
      </nav>
    </div>
  );
}
