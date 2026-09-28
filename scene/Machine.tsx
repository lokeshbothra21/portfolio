"use client";

// The moving parts of the Technic machine, driven by the live chat trace:
// the question brick rides the belt from station to station as each SSE event arrives.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Chat } from "@/components/chat";
import { brickGeometry, COLOURS, PLATE } from "./bricks";
import { MACHINE, machine } from "./builds";

type Stage = "idle" | "retrieving" | "gating" | "declined" | "generating" | "verifying" | "passed" | "flagged" | "fallback" | "error";

export function machineStage(chat: Chat): Stage {
  const t = chat.trace;
  if (chat.error) return "error";
  if (!chat.asked) return "idle";
  if (!t.retrieve) return "retrieving";
  if (!t.gate) return "gating";
  if (!t.gate.confident) return "declined";
  if (!t.generate) return "generating";
  if (t.generate.fallback) return "fallback";
  if (!t.verify) return "verifying";
  return t.verify.passed ? "passed" : "flagged";
}

const BRICK_COLOUR: Record<Stage, string> = {
  idle: COLOURS.yellow,
  retrieving: COLOURS.yellow,
  gating: COLOURS.yellow,
  generating: COLOURS.yellow,
  verifying: COLOURS.yellow,
  declined: COLOURS.red,
  passed: COLOURS.green,
  flagged: COLOURS.orange,
  fallback: COLOURS.azure,
  error: COLOURS.red,
};

const BELT_TOP = PLATE; // belt tiles are one plate tall
const approach = (current: number, target: number, dt: number, rate = 4) => current + (target - current) * (1 - Math.exp(-dt * rate));

function goal(stage: Stage): { x: number; z: number; y: number } {
  const on = (x: number) => ({ x, z: MACHINE.belt, y: BELT_TOP });
  switch (stage) {
    case "idle":
      return on(MACHINE.start);
    case "retrieving":
      return on(MACHINE.retrieve);
    case "gating":
      return on(MACHINE.gate - 1.6);
    case "declined":
      return { x: MACHINE.bin.x, z: MACHINE.bin.z, y: PLATE };
    case "generating":
      return on(MACHINE.llm);
    case "verifying":
      return on(MACHINE.verify);
    case "error":
      return on(MACHINE.start);
    default:
      return on(MACHINE.end);
  }
}

function Gear({ position, radius, speed }: { position: [number, number, number]; radius: number; speed: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const teeth = Math.round(radius * 8);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * (speed.current ?? 0) * (1 / radius);
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.35, 32]} />
        <meshStandardMaterial color={COLOURS.dark} roughness={0.4} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.3, 0.35, 0.22]} />
            <meshStandardMaterial color={COLOURS.dark} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color={COLOURS.yellow} />
      </mesh>
    </group>
  );
}

export function MachineParts({ chat, portal }: { chat: Chat; portal: RefObject<HTMLDivElement | null> }) {
  const stage = machineStage(chat);
  const brick = useRef<THREE.Mesh>(null);
  const arm = useRef<THREE.Group>(null);
  const stamp = useRef<THREE.Mesh>(null);
  const lights = useRef<THREE.MeshStandardMaterial[]>([]);
  const gearSpeed = useRef(0.4);
  const geometry = useMemo(() => brickGeometry(2, 2, 3, false, false), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.yellow, roughness: 0.32 }), []);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const g = goal(stage);
    const b = brick.current;
    if (b) {
      b.position.x = approach(b.position.x, g.x, dt, 2.5);
      b.position.z = approach(b.position.z, g.z, dt, 3);
      // Hop over gaps, settle onto the belt.
      const moving = Math.abs(b.position.x - g.x) > 0.05 || Math.abs(b.position.z - g.z) > 0.05;
      const bob = stage === "retrieving" || stage === "generating" ? Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.15 : 0;
      b.position.y = approach(b.position.y, g.y + 0.6 + (moving ? 0.25 : 0) + bob, dt, 8);
      (b.material as THREE.MeshStandardMaterial).color.lerp(target.set(BRICK_COLOUR[stage]), 1 - Math.exp(-dt * 4));
    }
    // Barrier: lifts for confident questions, stays down for declined ones.
    if (arm.current) {
      const open = ["generating", "verifying", "passed", "flagged", "fallback"].includes(stage);
      arm.current.rotation.x = approach(arm.current.rotation.x, open ? -Math.PI * 0.45 : 0, dt, 5);
    }
    // Gears race while the LLM writes.
    gearSpeed.current = approach(gearSpeed.current, stage === "generating" ? 7 : 0.4, dt, 3);
    // The stamp presses while verifying, and once more when the verdict lands.
    if (stamp.current) {
      const pressing = stage === "verifying" ? 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 9) : 0;
      stamp.current.position.y = approach(stamp.current.position.y, 3.1 - pressing * 1.2, dt, 12);
    }
    // Retrieval lights pulse while searching.
    lights.current.forEach((m, i) => {
      m.emissiveIntensity = stage === "retrieving" ? 1.6 + 1.3 * Math.sin(state.clock.elapsedTime * 10 + i * 2) : 0.15;
    });
  });

  const { w, d } = machine.base;
  return (
    <group position={[-w / 2, 0, -d / 2]}>
      <mesh ref={brick} geometry={geometry} material={material} position={[MACHINE.start, BELT_TOP + 0.6, MACHINE.belt]} castShadow />

      {/* Retrieval lights on the arch: BM25 (blue) and embeddings (purple). */}
      {[COLOURS.blue, COLOURS.purple].map((c, i) => (
        <mesh key={c} position={[4, 4.05, 3 + i * 2]}>
          <sphereGeometry args={[0.32, 20, 16]} />
          <meshStandardMaterial ref={(m) => void (m && (lights.current[i] = m))} color={c} emissive={c} emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Barrier arm, hinged on the gate post. */}
      <group ref={arm} position={[7.5, 2.35, 0.5]}>
        <mesh position={[0, 0, 2.6]} castShadow>
          <boxGeometry args={[0.35, 0.35, 5]} />
          <meshStandardMaterial color={COLOURS.red} roughness={0.35} />
        </mesh>
        {[1, 3].map((z) => (
          <mesh key={z} position={[0, 0.001, z + 0.6]}>
            <boxGeometry args={[0.37, 0.37, 0.7]} />
            <meshStandardMaterial color={COLOURS.white} />
          </mesh>
        ))}
      </group>

      {/* Gearbox gears. */}
      <Gear position={[11, 2.6, 1]} radius={1} speed={gearSpeed} />
      <Gear position={[12.95, 2.6, 1]} radius={0.8} speed={gearSpeed} />

      {/* Station labels. */}
      {(
        [
          ["Retrieve", "BM25 + embeddings", [4, 4.9, 3], ["retrieving"]],
          ["Confidence gate", "answer or decline", [7.5, 4.4, 1], ["gating"]],
          ["Declined", "off-topic questions", [8, 2.4, 8.4], ["declined"]],
          ["LLM", "grounded answer", [12, 3.8, 1], ["generating"]],
          ["Verify", "citations + numbers", [16, 4.9, 3], ["verifying", "passed", "flagged"]],
        ] as [string, string, [number, number, number], Stage[]][]
      ).map(([name, caption, pos, stages]) => (
        <Html key={name} position={pos} center portal={portal as RefObject<HTMLElement>}>
          <div className={`whitespace-nowrap rounded-md border-2 border-ink px-2 py-1 font-display shadow-[2px_2px_0_var(--ink)] ${stages.includes(stage) ? "bg-brick-yellow" : "bg-card"}`}>
            <span className="block text-[11px] font-extrabold leading-tight sm:text-xs">{name}</span>
            <span className="hidden font-mono text-[10px] leading-tight text-ink-soft sm:block">{caption}</span>
          </div>
        </Html>
      ))}

      {/* Verify stamp head. */}
      <mesh ref={stamp} position={[16, 3.1, 4]} castShadow>
        <boxGeometry args={[1.8, 0.6, 1.8]} />
        <meshStandardMaterial color={COLOURS["trans-green"]} roughness={0.2} />
      </mesh>
    </group>
  );
}
