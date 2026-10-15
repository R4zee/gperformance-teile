// 3D-Bühne: Licht, Kamera-Steuerung, Hotspots. Wird von Startseite, Konfigurator und Build-Seite genutzt.
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { CarConfig, Zone } from '../../lib/types';
import { ProceduralCar, makeMats } from './ProceduralCar';
import { GltfCar } from './GltfCar';
import './car-stage.css';

const VIEWS: Record<Zone, { pos: [number, number, number]; tgt: [number, number, number] }> = {
  overview: { pos: [5.6, 2.1, 6.4], tgt: [0, 0.55, 0] },
  felgen: { pos: [3.0, 0.6, 3.7], tgt: [1.4, 0.38, 0.85] },
  bremsen: { pos: [-0.55, 0.5, 3.2], tgt: [-1.41, 0.36, 0.9] },
  fahrwerk: { pos: [0.4, 0.55, 7.4], tgt: [0.1, 0.5, 0] },
  abgas: { pos: [-4.6, 0.75, 2.0], tgt: [-2.3, 0.4, 0] },
  front: { pos: [5.0, 0.95, 2.7], tgt: [2.0, 0.45, 0] },
  heck: { pos: [-5.0, 2.4, 3.0], tgt: [-1.9, 0.85, 0] },
  motor: { pos: [4.4, 3.3, 2.3], tgt: [1.2, 0.8, 0] }
};
const SPOTS: { zone: Exclude<Zone, 'overview'>; label: string; p: [number, number, number]; n: [number, number, number] }[] = [
  { zone: 'felgen', label: 'Felgen', p: [1.4, 0.34, 0.97], n: [0, 0, 1] },
  { zone: 'bremsen', label: 'Bremsen', p: [-1.41, 0.34, 0.97], n: [0, 0, 1] },
  { zone: 'fahrwerk', label: 'Fahrwerk', p: [1.4, 0.82, 0.92], n: [0, 0.3, 1] },
  { zone: 'abgas', label: 'Abgasanlage', p: [-2.45, 0.33, 0.4], n: [-1, 0, 0.2] },
  { zone: 'front', label: 'Frontlippe', p: [2.38, 0.26, 0.35], n: [1, 0, 0.2] },
  { zone: 'heck', label: 'Heckspoiler', p: [-2.25, 1.02, 0.35], n: [-1, 0.6, 0.2] },
  { zone: 'motor', label: 'Ansaugung', p: [1.5, 0.9, 0], n: [0.3, 1, 0] }
];
const BASE_TH = Math.atan2(5.6, 6.4);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type CarStageProps = {
  config: CarConfig;
  zone?: Zone;
  hotspots?: boolean;
  theme?: 'light' | 'dark';
  autorotate?: boolean;
  /** Startseite: Drehung in rad, von außen per Scroll gesetzt. */
  spinRef?: MutableRefObject<number | null>;
  model3d?: string;
  onZone?: (z: Exclude<Zone, 'overview'>) => void;
  className?: string;
};

type Shared = { drop: number; interact: number };

function Studio() {
  // Ersetzt das PMREM-Studio aus dem Prototyp: grauer Raum mit Lichtflächen.
  const lights: [number, number, number, number, number, number, number][] = [
    [0, 12.5, 0, 18, 0.5, 5, 7], [-13, 5, 0, 0.5, 3, 18, 3], [13, 5, 0, 0.5, 3, 18, 3], [0, 5, -14, 18, 3, 0.5, 2.2], [0, 5, 14, 18, 3, 0.5, 1.6]
  ];
  return (
    <Environment resolution={256} frames={1}>
      <mesh position-y={6}><boxGeometry args={[30, 14, 30]} /><meshBasicMaterial color={0x9a9a98} side={THREE.BackSide} toneMapped={false} /></mesh>
      {lights.map(([x, y, z, w, h, d, i], k) => (
        <mesh key={k} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshBasicMaterial color={[i, i, i]} toneMapped={false} /></mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[60, 60]} /><meshBasicMaterial color={0x2c2c2c} toneMapped={false} /></mesh>
    </Environment>
  );
}

function Ground({ dark }: { dark: boolean }) {
  const blob = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const cx = cv.getContext('2d')!, gr = cx.createRadialGradient(128, 128, 8, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[24, 24]} /><shadowMaterial opacity={dark ? 0.5 : 0.14} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}><planeGeometry args={[5.8, 2.7]} /><meshBasicMaterial map={blob} transparent depthWrite={false} /></mesh>
    </>
  );
}

/** Kamera auf Kugelkoordinaten um ein Ziel; Fahrten zwischen Zonen, Ziehen, Zoomen, Pinch. */
function Rig({ zone, autorotate, spinRef, shared }: { zone: Zone; autorotate?: boolean; spinRef?: MutableRefObject<number | null>; shared: Shared }) {
  const { camera, gl, size } = useThree();
  const st = useRef({ target: new THREE.Vector3(...VIEWS.overview.tgt), sph: { r: 1, th: 0, ph: 1 }, tw: null as null | { t0: number; p0: THREE.Vector3; t0v: THREE.Vector3; p1: THREE.Vector3; t1v: THREE.Vector3 }, ready: false });
  const s = st.current;
  const fromCam = () => {
    const o = camera.position.clone().sub(s.target), r = o.length();
    s.sph = { r, th: Math.atan2(o.x, o.z), ph: Math.acos(Math.min(1, Math.max(-1, o.y / r))) };
  };
  const toCam = () => {
    const { r, th, ph } = s.sph;
    camera.position.set(s.target.x + r * Math.sin(ph) * Math.sin(th), s.target.y + r * Math.cos(ph), s.target.z + r * Math.sin(ph) * Math.cos(th));
    camera.lookAt(s.target);
  };
  const goZone = (instant: boolean) => {
    const v = VIEWS[zone] || VIEWS.overview, aspect = size.width / Math.max(1, size.height);
    const fit = Math.pow(Math.max(1, 1.45 / aspect), 0.55);
    const tgt = new THREE.Vector3(...v.tgt), pos = new THREE.Vector3(...v.pos).sub(tgt).multiplyScalar(fit).add(tgt);
    if (instant) { s.target.copy(tgt); camera.position.copy(pos); camera.lookAt(tgt); fromCam(); return; }
    s.tw = { t0: performance.now(), p0: camera.position.clone(), t0v: s.target.clone(), p1: pos, t1v: tgt };
  };

  useEffect(() => { goZone(!s.ready); s.ready = true; }, [zone]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!s.tw && !shared.interact) goZone(true); }, [size.width, size.height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = gl.domElement, pts = new Map<number, [number, number]>(); let pinch = 0;
    const down = (e: PointerEvent) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); s.tw = null; shared.interact = performance.now(); };
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId); if (!prev) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) s.sph.r = Math.min(13, Math.max(2, s.sph.r * pinch / dd)); pinch = dd;
      } else {
        s.sph.th -= (e.clientX - prev[0]) * 0.006;
        s.sph.ph = Math.min(1.52, Math.max(0.2, s.sph.ph - (e.clientY - prev[1]) * 0.005));
      }
      toCam(); shared.interact = performance.now();
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); s.tw = null; s.sph.r = Math.min(13, Math.max(2, s.sph.r * (1 + e.deltaY * 0.001))); toCam(); shared.interact = performance.now(); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const now = performance.now(), dt = Math.min(0.05, delta), idle = !(shared.interact && now - shared.interact < 3000);
    if (s.tw) {
      const p = Math.min(1, (now - s.tw.t0) / 1100), e = ease(p);
      camera.position.lerpVectors(s.tw.p0, s.tw.p1, e); s.target.lerpVectors(s.tw.t0v, s.tw.t1v, e); camera.lookAt(s.target);
      if (p >= 1) { s.tw = null; fromCam(); }
    } else if (spinRef && spinRef.current != null && idle) {
      const tt = BASE_TH + spinRef.current;
      s.sph.th += (tt - s.sph.th) * Math.min(1, dt * 5); toCam();
    } else if (autorotate && idle) {
      s.sph.th += dt * 0.12; toCam();
    }
  });
  return null;
}

function Car({ config, model3d, shared, live }: { config: CarConfig; model3d?: string; shared: Shared; live: { current: boolean } }) {
  const M = useMemo(makeMats, []);
  const chassis = useRef<THREE.Group>(null);
  useEffect(() => { M.paint.color.set(config.paint); }, [M, config.paint]);
  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    shared.drop += ((config.drop || 0) - shared.drop) * Math.min(1, dt * 6);
    if (chassis.current) chassis.current.position.y = -shared.drop;
    live.current = true;
  });
  return model3d
    ? <GltfCar url={model3d} cfg={config} M={M} live={live} chassis={chassis} />
    : <ProceduralCar cfg={config} M={M} live={live} chassis={chassis} />;
}

/** Projiziert die Hotspot-Punkte in jedem Frame auf die DOM-Buttons. */
function SpotTracker({ els, enabled, shared }: { els: MutableRefObject<(HTMLButtonElement | null)[]>; enabled: boolean; shared: Shared }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const cp = camera.position, w = size.width, h = size.height;
    SPOTS.forEach((s, i) => {
      const el = els.current[i]; if (!el) return;
      v.set(s.p[0], s.p[1] - (s.zone === 'felgen' || s.zone === 'bremsen' ? 0 : shared.drop), s.p[2]);
      const facing = (cp.x - v.x) * s.n[0] + (cp.y - v.y) * s.n[1] + (cp.z - v.z) * s.n[2] > 0;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      const vis = enabled && facing && v.z < 1 && x > 8 && x < w - 40 && y > 8 && y < h - 8;
      el.classList.toggle('hide', !vis);
      el.style.transform = `translate(${x - 11}px,${y - 11}px)`;
    });
  });
  return null;
}

export default function CarStage({ config, zone = 'overview', hotspots = false, theme = 'light', autorotate, spinRef, model3d, onZone, className }: CarStageProps) {
  const shared = useRef<Shared>({ drop: config.drop || 0, interact: 0 }).current;
  const live = useRef(false);
  const spotEls = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className={`gp-stage${theme === 'dark' ? ' dark' : ''}${className ? ' ' + className : ''}`}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 30, near: 0.1, far: 100, position: VIEWS.overview.pos }}
      >
        <Studio />
        <hemisphereLight args={[0xffffff, 0xd8d8d6, 0.5]} />
        <directionalLight
          position={[2.5, 9, 3.5]} intensity={1.5} castShadow
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-camera-near={1} shadow-camera-far={20}
        />
        <Ground dark={theme === 'dark'} />
        <Suspense fallback={null}>
          <Car config={config} model3d={model3d || undefined} shared={shared} live={live} />
        </Suspense>
        <Rig zone={zone} autorotate={autorotate} spinRef={spinRef} shared={shared} />
        <SpotTracker els={spotEls} enabled={hotspots} shared={shared} />
      </Canvas>
      <div className="spots">
        {SPOTS.map((s, i) => (
          <button
            key={s.zone} type="button" ref={el => { spotEls.current[i] = el; }}
            className={`s hide${s.zone === zone ? ' on' : ''}`}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onZone?.(s.zone)}
          ><i /><span>{s.label}</span></button>
        ))}
      </div>
    </div>
  );
}
