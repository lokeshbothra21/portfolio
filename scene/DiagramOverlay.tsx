"use client";

// The interactive layer over an architecture build: a label on every module,
// a click target around it, and packets riding each conveyor to show the data flow.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { brickGeometry, COLOURS, PLATE } from "./bricks";
import type { LaidOut } from "./diagrams";

type Mod = LaidOut["modules"][number];

const visibleAt = (m: Mod, step: number) => step >= m.step && (m.rejectAt === undefined || step < m.rejectAt);

function Label({ m, active, onSelect, hovered, setHovered, portal }: { m: Mod; active: boolean; onSelect: () => void; hovered: boolean; setHovered: (id: string | null) => void; portal: RefObject<HTMLDivElement | null> }) {
  const [cx, cz] = [m.x + m.w / 2, m.z + m.d / 2];
  const warning = m.rejectAt !== undefined;
  return (
    <Html position={[cx, m.top + 0.9, cz]} center portal={portal as RefObject<HTMLElement>}>
      <button
        type="button"
        onClick={onSelect}
        onPointerEnter={() => setHovered(m.id)}
        onPointerLeave={() => setHovered(null)}
        className={`pointer-events-auto block whitespace-nowrap rounded-md text-left font-display shadow-[2px_2px_0_var(--ink)] transition-transform ${
          // On phones, labels from earlier steps shrink to small chips so the current step stays readable.
          active || hovered ? "border-2 px-2 py-1" : "border px-1 py-0.5 sm:border-2 sm:px-2 sm:py-1"
        } ${
          warning ? "border-brick-red bg-[#ffe1ea]" : active ? "border-ink bg-brick-yellow" : "border-ink bg-card"
        } ${hovered ? "-translate-y-0.5 scale-105" : ""}`}
      >
        <span className={`block font-extrabold leading-tight sm:text-xs ${active || hovered ? "text-[11px]" : "text-[8px]"}`}>
          {warning && "⚠ "}
          {m.label}
        </span>
        <span className={`hidden font-mono text-[10px] leading-tight text-ink-soft ${active || hovered ? "sm:block" : ""}`}>{m.caption}</span>
      </button>
    </Html>
  );
}

/** A small tile that rides a conveyor path on a loop. */
function Packet({ path, offset }: { path: [number, number][]; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => brickGeometry(1, 1, 1, true, false), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.yellow, emissive: COLOURS.yellow, emissiveIntensity: 1.8, roughness: 0.3 }), []);
  const points = useMemo(() => path.map(([x, z]) => new THREE.Vector3(x + 0.5, PLATE + 0.2, z + 0.5)), [path]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh || points.length < 2) return;
    const speed = 2.2; // cells per second
    const t = ((state.clock.elapsedTime * speed + offset) % (points.length - 1 + 1.5)) / (points.length - 1);
    const clamped = Math.min(t, 1);
    const f = clamped * (points.length - 1);
    const i = Math.min(Math.floor(f), points.length - 2);
    mesh.position.lerpVectors(points[i], points[i + 1], f - i);
    mesh.visible = t <= 1;
  });

  return <mesh ref={ref} geometry={geometry} material={material} scale={[0.6, 0.6, 0.6]} />;
}

/** `portal` is a stable HTML layer over the canvas; labels mount there so they never get lost when the canvas wires up its events. */
/** A glowing frame on the baseplate around a module: marks what's new in this step, or what's under the pointer. */
function Outline({ m, strength }: { m: Mod; strength: number }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (ref.current) ref.current.emissiveIntensity = strength * (1.6 + 0.6 * Math.sin(state.clock.elapsedTime * 3));
  });
  const pad = 0.25;
  const [x0, z0, x1, z1] = [m.x - pad, m.z - pad, m.x + m.w + pad, m.z + m.d + pad];
  const t = 0.12;
  const bars: [number, number, number, number][] = [
    [(x0 + x1) / 2, z0, x1 - x0 + t, t],
    [(x0 + x1) / 2, z1, x1 - x0 + t, t],
    [x0, (z0 + z1) / 2, t, z1 - z0],
    [x1, (z0 + z1) / 2, t, z1 - z0],
  ];
  return (
    <group>
      {bars.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.24, z]}>
          <boxGeometry args={[w, 0.06, d]} />
          <meshStandardMaterial ref={i === 0 ? ref : undefined} color={COLOURS.yellow} emissive={COLOURS.yellow} emissiveIntensity={1.6 * strength} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function DiagramOverlay({ laid, step, onSelect, portal }: { laid: LaidOut; step: number; onSelect: (step: number) => void; portal: RefObject<HTMLDivElement | null> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { w, d } = laid.build.base;

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      {laid.modules
        .filter((m) => visibleAt(m, step))
        .map((m) => (
          <group key={m.id}>
            {/* Invisible click target around the module's bricks. */}
            <mesh
              position={[m.x + m.w / 2, m.top / 2, m.z + m.d / 2]}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(m.step);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(m.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHovered(null);
                document.body.style.cursor = "";
              }}
            >
              <boxGeometry args={[m.w + 0.2, m.top + 0.3, m.d + 0.2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {(m.step === step || hovered === m.id) && m.rejectAt === undefined && <Outline m={m} strength={hovered === m.id ? 1.3 : 1} />}
            <Label m={m} active={m.step === step} hovered={hovered === m.id} setHovered={setHovered} onSelect={() => onSelect(m.step)} portal={portal} />
          </group>
        ))}
      {laid.edges
        .filter((e) => step >= e.step)
        .map((e, i) => (
          <Packet key={`${e.from}-${e.to}`} path={e.path} offset={i * 1.7} />
        ))}
    </group>
  );
}
