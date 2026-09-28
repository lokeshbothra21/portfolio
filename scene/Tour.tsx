"use client";

import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAsk } from "@/components/chat";
import { profile, sets, type BrickSet } from "@/content/content";
import { BuildScene } from "./BuildScene";
import { cover, machine, type Build } from "./builds";
import { DiagramOverlay } from "./DiagramOverlay";
import type { LaidOut } from "./diagrams";
import { laidOut } from "./sets";
import { MachineParts } from "./Machine";
import { COLOURS } from "./bricks";
import { PanelBack, PanelCover, PanelMachine, PanelSet } from "./panels";
import { Effects, Studio, tinted } from "./Studio";

type Page = { id: string; label: string; accent: string; build?: Build; set?: BrickSet; laid?: LaidOut };

const PAGES: Page[] = [
  { id: "cover", label: "Cover", accent: COLOURS.yellow, build: cover },
  ...sets.filter((s) => laidOut[s.id]).map((s) => ({ id: s.id, label: `Set #${s.number} ${s.name}`, accent: COLOURS[s.colour], build: laidOut[s.id].build, set: s, laid: laidOut[s.id] })),
  { id: "machine", label: "The Technic machine", accent: COLOURS.azure, build: machine },
  { id: "back", label: "Back cover", accent: COLOURS.red, build: cover },
];

function readUrl(): { page: number; step: number } {
  const q = new URLSearchParams(window.location.search);
  const page = Math.max(0, PAGES.findIndex((p) => p.id === q.get("page")));
  const max = (PAGES[page].build?.steps.length ?? 1) - 1;
  const step = Math.min(Math.max(0, Number(q.get("step")) || 0), max);
  return { page, step };
}

/**
 * Eases the camera to each page's viewpoint, then drifts gently around it.
 * Dragging takes over; the drift resumes from wherever the visitor leaves it.
 */
function CameraRig({ build, drift }: { build: Build; drift: boolean }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const mode = useRef<"moving" | "idle" | "user">("moving");
  const idleSince = useRef(0);
  const releasedAt = useRef(0);
  const base = useRef(new THREE.Vector3());
  const goal = useMemo(() => {
    const off = new THREE.Vector3(build.base.w / 2, 0, build.base.d / 2);
    return {
      position: new THREE.Vector3(...build.camera.position).sub(off),
      target: new THREE.Vector3(...build.camera.target).sub(off),
    };
  }, [build]);

  useEffect(() => {
    mode.current = "moving";
    const grab = () => (mode.current = "user");
    const release = () => (releasedAt.current = performance.now());
    controls?.addEventListener("start", grab);
    controls?.addEventListener("end", release);
    return () => {
      controls?.removeEventListener("start", grab);
      controls?.removeEventListener("end", release);
    };
  }, [goal, controls]);

  useFrame((state, dt) => {
    if (!controls) return;
    const now = state.clock.elapsedTime;
    if (mode.current === "moving") {
      const k = 1 - Math.exp(-dt * 3);
      camera.position.lerp(goal.position, k);
      controls.target.lerp(goal.target, k);
      controls.update();
      if (camera.position.distanceTo(goal.position) < 0.02) {
        mode.current = "idle";
        idleSince.current = now;
        base.current.copy(goal.position);
      }
    } else if (mode.current === "user") {
      if (drift && releasedAt.current && performance.now() - releasedAt.current > 5000) {
        mode.current = "idle";
        idleSince.current = now;
        base.current.copy(camera.position);
      }
    } else if (drift) {
      // A slow sway of about ±6° around the build.
      const angle = Math.sin((now - idleSince.current) * 0.18) * 0.1;
      const offset = base.current.clone().sub(controls.target).applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
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
  // Contact shading and glow on capable screens; dropped automatically if the frame rate sags.
  const [fx, setFx] = useState(() => window.innerWidth >= 768 && (navigator.hardwareConcurrency ?? 4) >= 4);
  const current = PAGES[page];
  const steps = current.build?.steps.length ?? 1;
  const chat = useAsk();
  const labels = useRef<HTMLDivElement>(null);

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
    <div
      className="fixed inset-0 overflow-hidden transition-[background] duration-700"
      style={{ background: `radial-gradient(ellipse at 55% 35%, #fffaf2 0%, ${tinted(current.accent, 0.16)} 50%, ${tinted(current.accent, 0.42)} 110%)` }}
    >
      <Canvas shadows="soft" dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 10, 26] }} gl={{ alpha: true }} aria-hidden="true">
        <PerformanceMonitor onDecline={() => setFx(false)} />
        <Studio />
        {fx && <Effects />}
        {current.build && <BuildScene key={current.id} build={current.build} step={step} instant={reducedMotion} />}
        {current.laid && <DiagramOverlay key={`${current.id}-overlay`} laid={current.laid} step={step} onSelect={(s) => setPos({ page, step: s })} portal={labels} />}
        {current.id === "machine" && <MachineParts chat={chat} portal={labels} />}
        {current.build && <CameraRig build={current.build} drift={!reducedMotion} />}
        <ViewShift />
        <OrbitControls makeDefault enablePan={false} enableDamping minDistance={10} maxDistance={40} maxPolarAngle={Math.PI * 0.46} />
      </Canvas>
      {/* Labels for 3D parts render here: above the canvas, below the panels. */}
      <div ref={labels} className="pointer-events-none absolute inset-0 overflow-hidden" />

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
          {current.id === "machine" && <PanelMachine chat={chat} />}
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
