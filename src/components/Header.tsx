import { useStore } from '../lib/store';

export default function Header({ fallbackKey }: { fallbackKey: string }) {
  const { vehicle, builds } = useStore();
  const key = vehicle?.key || fallbackKey;
  const n = Object.keys(builds[key] || {}).length;
  return (
    <header className="hdr">
      <div className="hdr-l">
        <a href="/" className="hdr-logo" aria-label="G Performance – Startseite">
          <img src="/assets/gp-logo.jpg" alt="G Performance" width={112} height={112} />
        </a>
        <nav className="hdr-nav" aria-label="Hauptnavigation">
          <a href="/fahrzeuge/">Fahrzeuge</a>
          <a href="/#beliebt">Builds</a>
          <a href="https://www.youtube.com/@GPerformance" target="_blank" rel="noopener">YouTube</a>
        </nav>
      </div>
      <div className="hdr-r">
        {vehicle && <a href="/fahrzeuge/" className="hdr-veh"><span>{vehicle.label}</span></a>}
        <a href={`/${key}/build/`} className="hdr-build">{n ? `Build (${n})` : 'Build'}</a>
      </div>
    </header>
  );
}
