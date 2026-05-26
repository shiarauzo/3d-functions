import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Trail } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Vignette,
} from "@react-three/postprocessing";
import {
  type CSSProperties,
  type MutableRefObject,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import katex from "katex";
import type { Fn } from "./functions";
import { buildSolid, surfacePoint } from "./geometry";

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

function Solid({
  fn,
  hovered,
  bloomRef,
}: {
  fn: Fn;
  hovered: boolean;
  bloomRef: MutableRefObject<any>;
}) {
  const { geometry, transform } = useMemo(() => buildSolid(fn), [fn]);
  const hue = useMemo(() => new THREE.Color(fn.hue), [fn.hue]);
  const glassTint = useMemo(() => new THREE.Color(fn.hue).lerp(new THREE.Color("#ffffff"), 0.6), [fn.hue]);
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const dots = useRef<THREE.Points>(null!);
  const mat = useRef<any>(null);
  const particle = useRef<THREE.Mesh>(null!);
  const sweep = useRef<THREE.Mesh>(null!);
  const sweepMat = useRef<THREE.MeshBasicMaterial>(null!);
  const morph = useRef(0);
  const phase = useRef(Math.random());
  const drift = useRef(Math.random() * 100);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camera = useThree((s) => s.camera);

  // sparse "quantity" dots (the reference's yellow proportional symbols):
  // a coarse sampling of the revolution surface, baked once.
  const qDots = useMemo(() => {
    const NU = 14;
    const NV = 9;
    const pos = new Float32Array(NU * NV * 3);
    const v = new THREE.Vector3();
    let p = 0;
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        surfacePoint(fn, transform, (i + 0.5) / NU, (j + 0.5) / NV, 0, v);
        pos[p++] = v.x;
        pos[p++] = v.y;
        pos[p++] = v.z;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [fn, transform]);

  // thermal ramp: colour each surface point by distance from the revolution
  // axis — white-hot near the core, fading to the category hue at the rim.
  useMemo(() => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const n = pos.count;
    const colors = new Float32Array(n * 3);
    let maxR = 0;
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(pos.getY(i), pos.getZ(i));
      if (r > maxR) maxR = r;
    }
    const c = new THREE.Color();
    const white = new THREE.Color("#ffffff");
    for (let i = 0; i < n; i++) {
      const t = maxR ? Math.hypot(pos.getY(i), pos.getZ(i)) / maxR : 0;
      c.copy(white).lerp(hue, Math.pow(t, 0.7));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }, [geometry, hue]);

  // R3F builds the Mesh with a placeholder geometry, so morph influences aren't
  // wired up when our morph-bearing geometry is attached. Re-sync them here.
  useLayoutEffect(() => {
    mesh.current.updateMorphTargets();
    dots.current.updateMorphTargets();
  }, [geometry]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);

    // gentle parallax sway, unique phase per cell, for depth and life
    const t = state.clock.elapsedTime + drift.current;
    camera.position.set(Math.sin(t * 0.3) * 0.28, Math.cos(t * 0.24) * 0.2, 4.2);
    camera.lookAt(0, 0, 0);

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

    // luminance sweep scanning along the revolution axis (x), brightest at center
    const sx = -1.15 + 2.3 * u;
    sweep.current.position.x = sx;
    sweepMat.current.opacity = (1 - Math.abs(sx) / 1.15) * 0.6;

    // intensify the glass on hover
    if (mat.current) {
      mat.current.iridescence = THREE.MathUtils.lerp(
        mat.current.iridescence,
        0.35 + 0.65 * morph.current,
        dt * 4,
      );
      mat.current.opacity = THREE.MathUtils.lerp(
        mat.current.opacity,
        0.6 + 0.25 * morph.current,
        dt * 4,
      );
    }

    // hovered cell blooms brighter
    if (bloomRef.current) {
      bloomRef.current.intensity = THREE.MathUtils.lerp(
        bloomRef.current.intensity,
        hovered ? 2.1 : 1.15,
        dt * 4,
      );
    }
  });

  return (
    <group ref={group} rotation={[0.32, 0, 0]}>
      {/* diffuse heat bloom behind the solid — dense regions read as a halo */}
      <sprite position={[0, 0, -0.6]} scale={[3.2, 3.2, 3.2]}>
        <spriteMaterial
          map={DOT_TEXTURE}
          color={hue}
          transparent
          opacity={0.28}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh ref={mesh} geometry={geometry}>
        {/* Iridescent physical glass — no transmission buffer, so 16 cells stay
            light. The glowing point-field dominates the look anyway. */}
        <meshPhysicalMaterial
          ref={mat}
          transmission={0}
          roughness={0.14}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.18}
          iridescence={0.4}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 800]}
          color={glassTint}
          transparent
          opacity={0.6}
          envMapIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* travelling luminance sweep ring (axis = x) */}
      <mesh ref={sweep} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.05, 0.012, 8, 48]} />
        <meshBasicMaterial
          ref={sweepMat}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <points ref={dots} geometry={geometry}>
        <pointsMaterial
          map={DOT_TEXTURE}
          vertexColors
          color="#ffffff"
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* sparse signal-yellow "quantity" dots overlaid on the field */}
      <points geometry={qDots}>
        <pointsMaterial
          map={DOT_TEXTURE}
          color="#F8E71C"
          size={0.11}
          sizeAttenuation
          transparent
          opacity={0.85}
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
  const bloomRef = useRef<any>(null);

  // mock "density" readout derived from the function's peak magnitude
  const peak = useMemo(() => {
    const [a, b] = fn.domain;
    let m = 0;
    for (let i = 0; i <= 80; i++) {
      const v = Math.abs(fn.f(a + ((b - a) * i) / 80));
      if (Number.isFinite(v) && v > m) m = v;
    }
    return Math.max(1, Math.round(m * 137));
  }, [fn]);

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

      {/* map chrome: north arrow + scale bar, instrument annotations */}
      <span className="cell-north" aria-hidden>
        <svg viewBox="0 0 12 16" width="9" height="12">
          <path d="M6 0 L11 14 L6 10 L1 14 Z" fill="currentColor" />
        </svg>
        N
      </span>
      <span className="cell-scale" aria-hidden>
        <span className="cell-scale__bar" />
        <span className="cell-scale__txt">0 · 1 · 2 units</span>
      </span>

      <Canvas
        dpr={[1, 1.75]}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 0, 4.2], fov: 30 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Solid fn={fn} hovered={hovered} bloomRef={bloomRef} />
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={1.4} position={[0, 2, 3]} scale={[6, 6, 1]} color={fn.hue} />
          <Lightformer intensity={0.7} position={[-3, -1, 2]} scale={[4, 4, 1]} color="#ffffff" />
          <Lightformer intensity={0.6} position={[3, 1, -2]} scale={[4, 4, 1]} color={fn.hue} />
        </Environment>
        <EffectComposer multisampling={0}>
          <Bloom
            ref={bloomRef}
            intensity={1.15}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.35}
            mipmapBlur
            radius={0.7}
          />
          <HueSaturation saturation={0.14} />
          <BrightnessContrast brightness={0.0} contrast={0.1} />
          <Vignette eskil={false} offset={0.22} darkness={0.9} />
        </EffectComposer>
      </Canvas>
      <div className="cell-legend">
        <span className="cell-legend__label">EVENT DENSITY / unit²</span>
        <span className="cell-legend__bar" />
        <span className="cell-legend__scale">
          <span>0</span>
          <span>{peak.toLocaleString("en-US")}</span>
        </span>
        <span className="cell-legend__dots" aria-hidden>
          <i style={{ width: 3, height: 3 }} />
          <i style={{ width: 5, height: 5 }} />
          <i style={{ width: 8, height: 8 }} />
        </span>
      </div>

      <div className="caption" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
