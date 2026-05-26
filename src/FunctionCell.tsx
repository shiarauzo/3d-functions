import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Trail,
} from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import katex from "katex";
import type { Fn } from "./functions";
import { buildSolid, surfacePoint } from "./geometry";

const BG = new THREE.Color("#000000");

function Solid({ fn, hovered }: { fn: Fn; hovered: boolean }) {
  const { geometry, transform } = useMemo(() => buildSolid(fn), [fn]);
  const hue = useMemo(() => new THREE.Color(fn.hue), [fn.hue]);
  const glassTint = useMemo(() => new THREE.Color(fn.hue).lerp(new THREE.Color("#ffffff"), 0.6), [fn.hue]);
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<any>(null);
  const particle = useRef<THREE.Mesh>(null!);
  const morph = useRef(0);
  const phase = useRef(Math.random());
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // R3F builds the Mesh with a placeholder geometry, so morph influences aren't
  // wired up when our morph-bearing geometry is attached. Re-sync them here.
  useLayoutEffect(() => {
    mesh.current.updateMorphTargets();
  }, [geometry]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const target = hovered ? 1 : 0;
    morph.current += (target - morph.current) * Math.min(1, dt * 3.5);

    if (mesh.current.morphTargetInfluences) {
      mesh.current.morphTargetInfluences[0] = morph.current;
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

      <Trail width={1.2} length={5} decay={1.4} color={hue} attenuation={(t) => t * t}>
        <mesh ref={particle}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </Trail>
    </group>
  );
}

export function FunctionCell({
  fn,
  hovered,
  dimmed,
  onHover,
}: {
  fn: Fn;
  hovered: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
}) {
  const html = useMemo(
    () => katex.renderToString(fn.latex, { throwOnError: false }),
    [fn.latex],
  );

  return (
    <div
      className={`cell${hovered ? " is-hovered" : ""}${dimmed ? " is-dimmed" : ""}`}
      onPointerEnter={() => onHover(fn.id)}
      onPointerLeave={() => onHover(null)}
    >
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
      </Canvas>
      <div className="caption" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
