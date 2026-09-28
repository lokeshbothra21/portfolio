"use client";

// Lighting, surroundings and post effects that make the bricks look like a toy photo.
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

const PAPER = "#efe4cc";

/** The page's accent blended into warm paper: used for the tabletop and the CSS backdrop. */
export function tinted(accent: string, amount: number) {
  return "#" + new THREE.Color(PAPER).lerp(new THREE.Color(accent), amount).getHexString();
}

export function Studio() {
  return (
    <>
      {/* Soft studio reflections for the glossy plastic, built from light panels (no HDR download). */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 12, 4]} scale={[20, 8, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} position={[-14, 4, 6]} scale={[10, 6, 1]} rotation-y={Math.PI / 2} color="#fff1d6" />
        <Lightformer form="rect" intensity={1.1} position={[14, 5, -4]} scale={[10, 6, 1]} rotation-y={-Math.PI / 2} color="#dbe8ff" />
        <Lightformer form="ring" intensity={2} position={[4, 6, 16]} scale={4} />
      </Environment>

      <hemisphereLight args={["#fff6e0", "#8a7a60", 0.55]} />
      <directionalLight
        position={[10, 20, 12]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      <directionalLight position={[-12, 8, -6]} intensity={0.45} color="#cfe3ff" />

      {/* An invisible floor that only catches the build's shadow, so the tinted backdrop shows through. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.21, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
    </>
  );
}

/** Contact shading between bricks and a glow on lights. Only mounted on devices that keep up. */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={1.1} intensity={2.2} distanceFalloff={0.6} quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={1} intensity={0.7} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
