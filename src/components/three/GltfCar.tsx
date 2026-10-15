// Echtes Fahrzeugmodell (GLB). Aufbau-Konvention siehe docs/3D-MODELLE.md.
// Serienteile zeigt das Modell selbst; getauschte Teile werden darübergelegt.
import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CarConfig } from '../../lib/types';
import { ANCHORS, Lip, Intake, Pop, Spoiler, Tips, WHEEL_POS, Wheel, type Mats } from './ProceduralCar';

const WHEEL_NODES = ['wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR'];
const v3 = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2]);

export function GltfCar({ url, cfg, M, live, chassis }: { url: string; cfg: CarConfig; M: Mats; live: { current: boolean }; chassis: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(url, '/draco/');
  const root = useMemo(() => scene.clone(true), [scene]);

  const info = useMemo(() => {
    root.updateMatrixWorld(true);
    const named = (n: string) => root.getObjectByName(n);
    const anchor = (n: keyof typeof ANCHORS) => {
      const o = named(`anchor_${n}`);
      return o ? o.getWorldPosition(new THREE.Vector3()).sub(v3(ANCHORS[n])) : new THREE.Vector3();
    };
    const wheels = WHEEL_NODES.map((n, i) => {
      const o = named(n);
      const [x, sd] = WHEEL_POS[i];
      return { node: o, pos: o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(x, 0.345, sd * 0.8), sd };
    });
    const mats: Record<string, THREE.MeshStandardMaterial[]> = {};
    root.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => { (mats[mt.name] ||= []).push(mt as THREE.MeshStandardMaterial); });
    });
    return { body: named('body') || root, tips: named('exhaust_tips'), wheels, mats, off: { tips: anchor('tips'), lip: anchor('lip'), spoiler: anchor('spoiler'), intake: anchor('intake') } };
  }, [root]);

  // Lack und Bremssattel-Farbe werden direkt am Modell gesetzt.
  useEffect(() => { info.mats.paint?.forEach(m => m.color.set(cfg.paint)); }, [info, cfg.paint]);
  useEffect(() => { if (cfg.caliper && !cfg.stock.bremsen) info.mats.caliper?.forEach(m => m.color.set(cfg.caliper!)); }, [info, cfg.caliper, cfg.stock.bremsen]);

  const ownWheels = !!cfg.stock.felgen;
  const ownTips = !!cfg.stock.abgas && !!info.tips;
  useEffect(() => { info.wheels.forEach(w => w.node && (w.node.visible = ownWheels)); }, [info, ownWheels]);
  useEffect(() => { if (info.tips) info.tips.visible = ownTips; }, [info, ownTips]);

  // Der Fahrwerks-Drop bewegt die Karosserie (Knoten „body“). Dafür hängen wir sie in die chassis-Gruppe.
  // Ohne „body“-Knoten senkt sich das ganze Modell.
  useEffect(() => {
    const g = chassis.current; if (!g || info.body === root) return;
    const parent = info.body.parent!;
    g.attach(info.body);
    return () => { parent.attach(info.body); };
  }, [info, root, chassis]);
  const wk = JSON.stringify([cfg.rim, cfg.caliper]);

  return (
    <group>
      {info.body !== root && <primitive object={root} />}
      <group ref={chassis}>
        {info.body === root && <primitive object={root} />}
        {!ownTips && <group position={info.off.tips}><Pop key={`t${cfg.tips}`} live={live}><Tips kind={cfg.tips || 'chrome'} M={M} /></Pop></group>}
        {cfg.lip && <group position={info.off.lip}><Pop key={`l${cfg.lip}`} live={live}><Lip kind={cfg.lip} M={M} /></Pop></group>}
        {cfg.spoiler && <group position={info.off.spoiler}><Pop key={`s${cfg.spoiler}`} live={live}><Spoiler kind={cfg.spoiler} M={M} /></Pop></group>}
        {cfg.intake && <group position={info.off.intake}><Pop key={`i${cfg.intake}`} live={live}><Intake kind={cfg.intake} M={M} /></Pop></group>}
      </group>
      {!ownWheels && info.wheels.map((w, i) => (
        <group key={`${wk}${i}`} position={w.pos} rotation-y={w.sd < 0 ? Math.PI : 0}>
          <Pop live={live}><Wheel rim={cfg.rim || {}} caliper={cfg.caliper} M={M} /></Pop>
        </group>
      ))}
    </group>
  );
}
