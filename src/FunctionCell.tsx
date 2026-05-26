import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Trail,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { type CSSProperties, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import katex from "katex";
import type { Fn } from "./functions";
import { buildSolid, surfacePoint } from "./geometry";

const BG = new THREE.Color("#000000");

/** A soft radial sprite so each surface point reads as a glowing dot. */
function makeDotTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const DOT_TEXTURE = /* @__PURE__ */ makeDotTexture();

function Solid({ fn, hovered }: { fn: Fn; hovered: boolean }) {
  const { geometry, transform } = useMemo(() => buildSolid(fn), [fn]);
  const hue = useMemo(() => new THREE.Color(fn.hue), [fn.hue]);
  const glassTint = useMemo(() => new THREE.Color(fn.hue).lerp(new THREE.Color("#ffffff"), 0.6), [fn.hue]);
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const dots = useRef<THREE.Points>(null!);
  const mat = useRef<any>(null);
  const particle = useRef<THREE.Mesh>(null!);
  const morph = useRef(0);
  const phase = useRef(Math.random());
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // R3F builds the Mesh with a placeholder geometry, so morph influences aren't
  // wired up when our morph-bearing geometry is attached. Re-sync them here.
  useLayoutEffect(() => {
    mesh.current.updateMorphTargets();
    dots.current.updateMorphTargets();
  }, [geometry]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const target = hovered ? 1 : 0;
    morph.current += (target - morph.current) * Math.min(1, dt * 3.5);

    if (mesh.current.morphTargetInfluences) {
      mesh.current.morphTargetInfluences[0] = morph.current;
    }
    if (dots.current.morphTargetInfluences) {
      dots.current.morphTargetInfluences[0] = morph.current;
    }
    group.current.rotation.y += dt * (0.16 + morph.current * 0.4);

    // spiral particle riding the morphing surface
    phase.current = (phase.current + dt * 0.16) % 1;
    const u = phase.current;
    const v = (u * fn.turns) % 1;
    surfacePoint(fn, transform, u, v, morph.current, tmp);
    particle.current.position.copy(tmp);

    // intensify the glass on hover
    if (mat.current) {
      mat.current.iridescence = THREE.MathUtils.lerp(
        mat.current.iridescence,
        0.35 + 0.65 * morph.current,
        dt * 4,
      );
      mat.current.chromaticAberration = THREE.MathUtils.lerp(
        mat.current.chromaticAberration,
        0.06 + 0.22 * morph.current,
        dt * 4,
      );
    }
  });

  return (
    <group ref={group} rotation={[0.32, 0, 0]}>
      <mesh ref={mesh} geometry={geometry}>
        <MeshTransmissionMaterial
          ref={mat}
          samples={4}
          resolution={128}
          transmission={1}
          thickness={0.6}
          roughness={0.06}
          ior={1.45}
          chromaticAberration={0.08}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.4}
          iridescence={0.4}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 800]}
          color={glassTint}
          background={BG}
          side={THREE.DoubleSide}
        />
      </mesh>

      <points ref={dots} geometry={geometry}>
        <pointsMaterial
          map={DOT_TEXTURE}
          color={hue}
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <Trail width={2.2} length={6} decay={1.5} color={hue} attenuation={(t) => t * t}>
        <mesh ref={particle}>
          {/* white-hot core that drives the bloom */}
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
          {/* tight hue halo */}
          <sprite scale={[0.28, 0.28, 0.28]}>
            <spriteMaterial
              map={DOT_TEXTURE}
              color={hue}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          {/* wide soft glow */}
          <sprite scale={[0.7, 0.7, 0.7]}>
            <spriteMaterial
              map={DOT_TEXTURE}
              color={hue}
              transparent
              opacity={0.45}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </mesh>
      </Trail>
    </group>
  );
}

export function FunctionCell({
  fn,
  index,
  hovered,
  dimmed,
  onHover,
}: {
  fn: Fn;
  index: number;
  hovered: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
}) {
  const html = useMemo(
    () => katex.renderToString(fn.latex, { throwOnError: false }),
    [fn.latex],
  );
  const idx = String(index + 1).padStart(2, "0");

  return (
    <div
      className={`cell${hovered ? " is-hovered" : ""}${dimmed ? " is-dimmed" : ""}`}
      style={{ "--hue": fn.hue } as CSSProperties}
      onPointerEnter={() => onHover(fn.id)}
      onPointerLeave={() => onHover(null)}
    >
      <div className="cell-title">
        <span className="cell-title__name">{fn.label}</span>
        <span className="cell-title__desc">
          DENSITY FIELD · REVOLUTION
        </span>
      </div>
      <span className="cell-index">F{idx}</span>
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 4.2], fov: 30 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Solid fn={fn} hovered={hovered} />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={1.4} position={[0, 2, 3]} scale={[6, 6, 1]} color={fn.hue} />
          <Lightformer intensity={0.7} position={[-3, -1, 2]} scale={[4, 4, 1]} color="#ffffff" />
          <Lightformer intensity={0.6} position={[3, 1, -2]} scale={[4, 4, 1]} color={fn.hue} />
        </Environment>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.35}
            mipmapBlur
            radius={0.7}
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      </Canvas>
      <div className="caption" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
