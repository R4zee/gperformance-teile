// Lädt three.js erst im Browser und erst dann, wenn die Bühne gebraucht wird.
import { lazy, Suspense, useEffect, useState } from 'react';
import type { CarStageProps } from './CarStage';

const CarStage = lazy(() => import('./CarStage'));

export default function LazyStage(props: CarStageProps) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  const loading = <div className="gp-stage-loading">3D-Modell lädt …</div>;
  return ok ? <Suspense fallback={loading}><CarStage {...props} /></Suspense> : loading;
}
