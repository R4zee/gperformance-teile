// Auswahl im Browser: aktives Fahrzeug + gewählte Teile je Fahrzeug (localStorage).
import { useEffect, useState } from 'react';
import type { ActiveVehicle, Build, CatId } from './types';

const KEY = 'gp-v1';
const EVT = 'gp-store';
type State = { vehicle: ActiveVehicle | null; builds: Record<string, Build> };

function read(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { vehicle: s.vehicle || null, builds: s.builds || {} };
  } catch { return { vehicle: null, builds: {} }; }
}
function write(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privater Modus */ }
  window.dispatchEvent(new Event(EVT));
}

export const store = {
  get: read,
  setVehicle(v: ActiveVehicle) { const s = read(); write({ ...s, vehicle: v }); },
  setPart(vehicleKey: string, cat: CatId, partId: string | null) {
    const s = read(), b = { ...(s.builds[vehicleKey] || {}) };
    if (partId) b[cat] = partId; else delete b[cat];
    write({ ...s, builds: { ...s.builds, [vehicleKey]: b } });
  },
  setBuild(vehicleKey: string, build: Build) { const s = read(); write({ ...s, builds: { ...s.builds, [vehicleKey]: build } }); }
};

/** Liefert den gespeicherten Zustand und aktualisiert bei Änderungen (auch aus anderen Tabs). */
export function useStore(): State {
  const [s, set] = useState<State>({ vehicle: null, builds: {} });
  useEffect(() => {
    const on = () => set(read());
    on();
    window.addEventListener(EVT, on); window.addEventListener('storage', on);
    return () => { window.removeEventListener(EVT, on); window.removeEventListener('storage', on); };
  }, []);
  return s;
}

export function useWidth() {
  const [w, setW] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth);
  useEffect(() => { const on = () => setW(window.innerWidth); on(); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return w;
}
