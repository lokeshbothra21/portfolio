"use client";

// Brick primitives for the 3D tour. Units: 1 = one stud pitch. A brick is 3 plates tall.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const PLATE = 0.4;
const GAP = 0.02; // tiny seam between neighbouring bricks
const STUD_R = 0.3;
const STUD_H = 0.18;

export const COLOURS = {
  red: "#c91a1a",
  blue: "#0a57b8",
  yellow: "#f2c230",
  green: "#1f7a3f",
  orange: "#f07d18",
  purple: "#6b3fa0",
  white: "#f2f0ea",
  black: "#1f2229",
  grey: "#9ea3a8",
  dark: "#4d535b",
  tan: "#d8c393",
  lime: "#8fc93a",
  azure: "#4fa8de",
  pink: "#e87aa4",
  base: "#2f8a4a",
  "trans-red": "#ff3b30",
  "trans-clear": "#dff3ff",
  "trans-green": "#34c759",
} as const;
export type Colour = keyof typeof COLOURS;

/** One brick in a build. x/z are the stud-grid corner, y is the level in plates. */
export type BrickSpec = {
  id?: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number; // plates: 1 = plate or tile, 3 = brick
  c: Colour;
  tile?: boolean; // smooth top, no studs
  round?: boolean; // 1x1 round brick
  glow?: boolean; // emissive, e.g. an alarm beacon
};

const geometryCache = new Map<string, THREE.BufferGeometry>();

export function brickGeometry(w: number, d: number, h: number, tile: boolean, round: boolean) {
  const key = `${w}x${d}x${h}${tile ? "t" : ""}${round ? "r" : ""}`;
  const hit = geometryCache.get(key);
  if (hit) return hit;
  const height = h * PLATE - GAP;
  const parts: THREE.BufferGeometry[] = [];
  const body = round
    ? new THREE.CylinderGeometry(w / 2 - GAP, w / 2 - GAP, height, 24)
    : new RoundedBoxGeometry(w - GAP * 2, height, d - GAP * 2, 2, Math.min(0.06, height / 4));
  parts.push(body.toNonIndexed());
  if (!tile) {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        const stud = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 20).toNonIndexed();
        stud.translate(i - w / 2 + 0.5, height / 2 + STUD_H / 2, j - d / 2 + 0.5);
        parts.push(stud);
      }
    }
  }
  // Each part keeps its own normals, so rounded edges and studs stay smooth.
  const merged = mergeGeometries(parts, false);
  geometryCache.set(key, merged);
  return merged;
}

const materialCache = new Map<string, THREE.MeshPhysicalMaterial>();

function brickMaterial(c: Colour, glow = false) {
  const key = `${c}${glow ? "*" : ""}`;
  const hit = materialCache.get(key);
  if (hit) return hit;
  const trans = c.startsWith("trans-");
  // Glossy ABS: a clearcoat over a slightly rough base. Glow colours run above 1 so bloom picks them up.
  const m = new THREE.MeshPhysicalMaterial({
    color: COLOURS[c],
    roughness: trans ? 0.08 : 0.38,
    clearcoat: trans ? 0.2 : 0.55,
    clearcoatRoughness: 0.22,
    metalness: 0,
    transparent: trans,
    opacity: trans ? 0.62 : 1,
    emissive: glow ? COLOURS[c] : "#000000",
    emissiveIntensity: glow ? 1.6 : 0,
  });
  materialCache.set(key, m);
  return m;
}

export function brickCentre(b: BrickSpec): [number, number, number] {
  return [b.x + b.w / 2, b.y * PLATE + (b.h * PLATE) / 2, b.z + b.d / 2];
}

const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

/**
 * A brick that drops in and snaps into place when `shown` turns true.
 * When it turns false it either lifts away, or (`fly`) spins off the build,
 * which is how the verifier throws out a rejected brick.
 */
export function Brick({ spec, shown, delay = 0, instant = false, exit = "lift" }: { spec: BrickSpec; shown: boolean; delay?: number; instant?: boolean; exit?: "lift" | "fly" }) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(shown && instant ? 1 : 0);
  const wait = useRef(delay);
  const lastShown = useRef(shown);
  const geometry = useMemo(() => brickGeometry(spec.w, spec.d, spec.h, !!spec.tile, !!spec.round), [spec.w, spec.d, spec.h, spec.tile, spec.round]);
  const material = useMemo(() => brickMaterial(spec.c, spec.glow), [spec.c, spec.glow]);
  const [x, y, z] = brickCentre(spec);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (lastShown.current !== shown) {
      lastShown.current = shown;
      wait.current = shown ? delay : exit === "fly" ? 0.5 : 0;
    }
    if (instant) progress.current = shown ? 1 : 0;
    else if (wait.current > 0) wait.current -= dt;
    else progress.current = THREE.MathUtils.clamp(progress.current + (shown ? dt / 0.5 : -dt / (exit === "fly" ? 0.9 : 0.3)), 0, 1);

    const p = progress.current;
    mesh.visible = p > 0.001;
    if (shown) {
      mesh.position.set(x, y + (1 - easeOutBack(p)) * 6, z);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.setScalar(1);
    } else if (exit === "fly") {
      const t = 1 - p;
      mesh.position.set(x + t * 7, y + Math.sin(t * Math.PI) * 4 + t * 2, z + t * 3);
      mesh.rotation.set(t * 6, t * 4, t * 3);
      mesh.scale.setScalar(Math.max(p, 0.001));
    } else {
      mesh.position.set(x, y + (1 - p) * 3, z);
      mesh.scale.setScalar(Math.max(p, 0.001));
    }
    if (spec.glow) (mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.2 + 1.2 * Math.sin(state.clock.elapsedTime * 4);
  });

  return <mesh ref={ref} geometry={geometry} material={material} castShadow receiveShadow />;
}

/** Studded baseplate the build sits on. */
export function Baseplate({ w, d, c = "base" }: { w: number; d: number; c?: Colour }) {
  const geometry = useMemo(() => brickGeometry(w, d, 0.5, false, false), [w, d]);
  const material = useMemo(() => brickMaterial(c), [c]);
  return <mesh geometry={geometry} material={material} position={[w / 2, -0.1, d / 2]} receiveShadow />;
}
