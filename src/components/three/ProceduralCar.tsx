// Stilisiertes Platzhalter-Auto (1:1 aus dem Design-Prototyp car-stage.js portiert).
// Koordinaten: Front zeigt nach +X, linke Seite nach +Z, Boden bei y = 0, Länge ≈ 4,7 m.
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CarConfig, Visual } from '../../lib/types';

export type Mats = ReturnType<typeof makeMats>;
export function makeMats() {
  return {
    paint: new THREE.MeshPhysicalMaterial({ color: '#1f5fa8', metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b0e12', metalness: 0.2, roughness: 0.04, envMapIntensity: 1.6 }),
    black: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.55, metalness: 0.2 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: '#0c0c0d', roughness: 0.15, metalness: 0.3, clearcoat: 1 }),
    carbon: new THREE.MeshPhysicalMaterial({ color: '#202124', roughness: 0.35, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbonTip: new THREE.MeshPhysicalMaterial({ color: '#202124', roughness: 0.35, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    tire: new THREE.MeshStandardMaterial({ color: '#1a1a1b', roughness: 0.92 }),
    barrel: new THREE.MeshStandardMaterial({ color: '#3a3b3e', roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide }),
    disc: new THREE.MeshStandardMaterial({ color: '#8f9195', roughness: 0.42, metalness: 0.85 }),
    head: new THREE.MeshPhysicalMaterial({ color: '#e9eef2', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.1, clearcoat: 1 }),
    tail: new THREE.MeshPhysicalMaterial({ color: '#5a0a0e', emissive: '#c0141c', emissiveIntensity: 0.45, roughness: 0.15, clearcoat: 1 }),
    liner: new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d9dadc', metalness: 1, roughness: 0.15, side: THREE.DoubleSide }),
    titan: new THREE.MeshPhysicalMaterial({ color: '#6d6ba8', metalness: 1, roughness: 0.25, iridescence: 1, iridescenceIOR: 1.6, side: THREE.DoubleSide })
  };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Kurzer „Pop“, wenn ein Teil getauscht wird. Beim ersten Rendern der Bühne nicht. */
export function Pop({ live, children }: { live: { current: boolean }; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef(live.current ? performance.now() : 0);
  useFrame(() => {
    if (!t0.current || !g.current) return;
    const p = Math.min(1, (performance.now() - t0.current) / 520);
    g.current.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.06 * (1 - p) - (1 - ease(p)) * 0.12);
    if (p >= 1) t0.current = 0;
  });
  return <group ref={g}>{children}</group>;
}

export function Box({ s, m, p, rz }: { s: [number, number, number]; m: THREE.Material; p: [number, number, number]; rz?: number }) {
  return <mesh position={p} rotation-z={rz || 0} material={m} castShadow><boxGeometry args={s} /></mesh>;
}

function Bar({ a, b, w, d, m, z }: { a: [number, number]; b: [number, number]; w: number; d: number; m: THREE.Material; z: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation-z={Math.atan2(b[1] - a[1], b[0] - a[0])} material={m} castShadow>
      <boxGeometry args={[len, w, d]} />
    </mesh>
  );
}

function extrude(pts: number[][], depth: number, bevel = 0.05, seg = 5) {
  const s = new THREE.Shape();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 32 });
  g.translate(0, 0, -depth / 2);
  return g;
}

function bodyGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-2.3, 0.3); s.lineTo(-1.81, 0.22); s.lineTo(-1.81, 0.34);
  s.absarc(-1.41, 0.34, 0.4, Math.PI, 0, true);
  s.lineTo(-1.01, 0.22); s.lineTo(1.0, 0.22); s.lineTo(1.0, 0.34);
  s.absarc(1.4, 0.34, 0.4, Math.PI, 0, true);
  s.lineTo(1.8, 0.24); s.lineTo(2.24, 0.27); s.lineTo(2.35, 0.44); s.lineTo(2.31, 0.62);
  s.lineTo(2.1, 0.73); s.lineTo(0.85, 0.86); s.lineTo(-1.3, 0.93); s.lineTo(-1.95, 0.98);
  s.lineTo(-2.28, 0.95); s.lineTo(-2.36, 0.7); s.lineTo(-2.3, 0.3);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 6, curveSegments: 40 });
  g.translate(0, 0, -0.88);
  return g;
}

/** Ein Rad mit Reifen, Bremsscheibe, Sattel und Felge. Außenseite zeigt nach +Z. */
export function Wheel({ rim, caliper, M }: { rim: NonNullable<Visual['rim']> | Record<string, never>; caliper?: string; M: Mats }) {
  const R = rim.r || 0.245;
  const geo = useMemo(() => {
    const tp = [[R, -0.12], [0.315, -0.126], [0.338, -0.105], [0.345, 0], [0.338, 0.105], [0.315, 0.126], [R, 0.12]].map(p => new THREE.Vector2(p[0], p[1]));
    return { tire: new THREE.LatheGeometry(tp, 56) };
  }, [R]);
  const cm = useMemo(() => new THREE.MeshPhysicalMaterial({ color: caliper || '#1f4fa3', roughness: 0.3, metalness: 0.1, clearcoat: 1 }), [caliper]);
  const rm = useMemo(() => new THREE.MeshPhysicalMaterial({ color: rim.color || '#c9cacc', metalness: rim.metal ?? 0.85, roughness: rim.rough ?? 0.3, clearcoat: 0.6 }), [rim.color, rim.metal, rim.rough]);
  const z = 0.1, inner = 0.055, outer = R - 0.012, st = rim.style || 'double';
  const spokes: ReactNode[] = [];
  const pt = (a: number, r: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];
  if (st === 'double') {
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; [-0.11, 0.11].forEach((o, j) => spokes.push(<Bar key={`${i}${j}`} a={pt(a, inner)} b={pt(a + o, outer)} w={0.03} d={0.035} m={rm} z={z} />)); }
  } else if (st === 'mesh' || st === 'thin12') {
    const n = st === 'mesh' ? 10 : 12, w = st === 'mesh' ? 0.026 : 0.018;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; spokes.push(<Bar key={i} a={pt(a, inner)} b={pt(a, outer)} w={w} d={0.04} m={rm} z={z} />); }
  } else if (st === 'y') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, mid = pt(a, R * 0.55);
      spokes.push(<Bar key={`${i}m`} a={pt(a, inner)} b={mid} w={0.05} d={0.04} m={rm} z={z} />);
      [-0.24, 0.24].forEach((o, j) => spokes.push(<Bar key={`${i}${j}`} a={mid} b={pt(a + o, outer)} w={0.03} d={0.035} m={rm} z={z} />));
    }
  }
  const ca = 2.35;
  return (
    <group>
      <mesh geometry={geo.tire} material={M.tire} rotation-x={Math.PI / 2} castShadow />
      <mesh material={M.barrel} rotation-x={Math.PI / 2}><cylinderGeometry args={[R - 0.008, R - 0.008, 0.23, 48, 1, true]} /></mesh>
      <mesh material={M.disc} rotation-x={Math.PI / 2} position-z={-0.02}><cylinderGeometry args={[0.19, 0.19, 0.03, 48]} /></mesh>
      <mesh material={M.barrel} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.095, 0.095, 0.05, 32]} /></mesh>
      <mesh material={cm} position={[Math.cos(ca) * 0.165, Math.sin(ca) * 0.165, 0.045]} rotation-z={ca}><boxGeometry args={[0.1, 0.22, 0.08]} /></mesh>
      {spokes}
      <mesh material={rm} position-z={z + 0.012}><torusGeometry args={[R - 0.004, 0.013, 8, 64]} /></mesh>
      <mesh material={rm} rotation-x={Math.PI / 2} position-z={z}><cylinderGeometry args={[0.06, 0.06, 0.045, 32]} /></mesh>
    </group>
  );
}

export const WHEEL_POS: [number, number][] = [[1.4, 1], [1.4, -1], [-1.41, 1], [-1.41, -1]];

export function Wheels({ cfg, M, live }: { cfg: CarConfig; M: Mats; live: { current: boolean } }) {
  const key = JSON.stringify([cfg.rim, cfg.caliper]);
  return (
    <group>
      {WHEEL_POS.map(([x, sd]) => (
        <group key={`${key}${x}${sd}`} position={[x, 0.345, sd * 0.8]} rotation-y={sd < 0 ? Math.PI : 0}>
          <Pop live={live}><Wheel rim={cfg.rim || {}} caliper={cfg.caliper} M={M} /></Pop>
        </group>
      ))}
    </group>
  );
}

// Anbauteile. Die Positionen sind die „Standard-Anker“; ein GLB-Modell kann sie über
// Empties (anchor_tips, anchor_lip, anchor_spoiler, anchor_intake) verschieben.
export const ANCHORS = { tips: [-2.37, 0.31, 0], lip: [2.16, 0.232, 0], spoiler: [-2.2, 1.0, 0], intake: [1.55, 0.835, 0] } as const;

export function Tips({ kind, M }: { kind: Visual['tips']; M: Mats }) {
  const mat = kind === 'carbon' ? M.carbonTip : kind === 'titan' ? M.titan : M.chrome, r = kind === 'carbon' ? 0.05 : 0.045;
  return (
    <group>
      {[-0.47, -0.33, 0.33, 0.47].map(zz => (
        <group key={zz}>
          <mesh material={mat} rotation-z={Math.PI / 2} position={[-2.37, 0.31, zz]}><cylinderGeometry args={[r, r, 0.13, 32, 1, true]} /></mesh>
          <mesh material={M.liner} rotation-y={-Math.PI / 2} position={[-2.35, 0.31, zz]}><circleGeometry args={[r * 0.92, 24]} /></mesh>
        </group>
      ))}
    </group>
  );
}

export function Lip({ kind, M }: { kind: NonNullable<Visual['lip']>; M: Mats }) {
  const m = kind === 'carbon' ? M.carbon : M.gloss;
  return (
    <group>
      <Box s={[0.36, 0.024, 1.72]} m={m} p={[2.16, 0.232, 0]} />
      {[1, -1].map(sd => <Box key={sd} s={[0.22, 0.06, 0.02]} m={m} p={[2.12, 0.26, sd * 0.86]} />)}
    </group>
  );
}

export function Spoiler({ kind, M }: { kind: NonNullable<Visual['spoiler']>; M: Mats }) {
  if (kind === 'lip') return <Box s={[0.16, 0.035, 1.6]} m={M.carbon} p={[-2.22, 1.0, 0]} rz={0.18} />;
  return (
    <group>
      {[0.48, -0.48].map(zz => <Box key={zz} s={[0.12, 0.2, 0.025]} m={M.carbon} p={[-2.12, 1.07, zz]} rz={0.15} />)}
      <Box s={[0.34, 0.025, 1.78]} m={M.carbon} p={[-2.16, 1.18, 0]} rz={-0.08} />
      {[0.9, -0.9].map(zz => <Box key={zz} s={[0.36, 0.1, 0.012]} m={M.carbon} p={[-2.16, 1.17, zz]} />)}
    </group>
  );
}

export function Intake({ kind, M }: { kind: NonNullable<Visual['intake']>; M: Mats }) {
  return <Box s={[0.5, 0.012, 0.5]} m={kind === 'carbon' ? M.carbon : M.gloss} p={[1.55, 0.835, 0]} rz={-0.1} />;
}

/** Alle tauschbaren Anbauteile (ohne Räder). */
export function AddOns({ cfg, M, live, skipTips }: { cfg: CarConfig; M: Mats; live: { current: boolean }; skipTips?: boolean }) {
  return (
    <>
      {!skipTips && <Pop key={`t${cfg.tips}`} live={live}><Tips kind={cfg.tips || 'chrome'} M={M} /></Pop>}
      {cfg.lip && <Pop key={`l${cfg.lip}`} live={live}><Lip kind={cfg.lip} M={M} /></Pop>}
      {cfg.spoiler && <Pop key={`s${cfg.spoiler}`} live={live}><Spoiler kind={cfg.spoiler} M={M} /></Pop>}
      {cfg.intake && <Pop key={`i${cfg.intake}`} live={live}><Intake kind={cfg.intake} M={M} /></Pop>}
    </>
  );
}

export function ProceduralCar({ cfg, M, live, chassis }: { cfg: CarConfig; M: Mats; live: { current: boolean }; chassis: React.RefObject<THREE.Group | null> }) {
  const geo = useMemo(() => ({
    body: bodyGeometry(),
    glass: extrude([[0.85, 0.84], [0.05, 1.33], [-0.75, 1.36], [-1.25, 1.22], [-1.95, 0.97], [-1.95, 0.9], [0.85, 0.82]], 1.36, 0.04),
    roof: extrude([[0.12, 1.28], [0.04, 1.345], [-0.75, 1.378], [-1.28, 1.235], [-1.22, 1.2], [-0.75, 1.33]], 1.34, 0.03)
  }), []);
  return (
    <group>
      <group ref={chassis}>
        <mesh geometry={geo.body} material={M.paint} castShadow receiveShadow />
        <mesh geometry={geo.glass} material={M.glass} castShadow receiveShadow />
        <mesh geometry={geo.roof} material={M.paint} castShadow receiveShadow />
        {[-1.41, 1.4].map(x => <Box key={x} s={[0.78, 0.5, 1.3]} m={M.liner} p={[x, 0.5, 0]} />)}
        {[1, -1].map(sd => (
          <group key={sd}>
            <Box s={[0.12, 0.07, 0.42]} m={M.head} p={[2.24, 0.66, sd * 0.6]} rz={-0.35} />
            <Box s={[0.06, 0.08, 0.46]} m={M.tail} p={[-2.33, 0.86, sd * 0.6]} rz={0.2} />
            <Box s={[0.04, 0.15, 0.24]} m={M.gloss} p={[2.34, 0.54, sd * 0.17]} />
            <Box s={[0.2, 0.09, 0.13]} m={M.paint} p={[0.6, 1.0, sd * 0.86]} />
            <Box s={[2.0, 0.05, 0.03]} m={M.black} p={[0.0, 0.25, sd * 0.925]} />
          </group>
        ))}
        <Box s={[0.05, 0.12, 1.0]} m={M.black} p={[2.31, 0.36, 0]} />
        <Box s={[0.26, 0.08, 1.1]} m={M.black} p={[-2.25, 0.26, 0]} />
        <AddOns cfg={cfg} M={M} live={live} />
      </group>
      <Wheels cfg={cfg} M={M} live={live} />
    </group>
  );
}
