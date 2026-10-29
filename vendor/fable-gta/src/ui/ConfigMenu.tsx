import { useGameStore } from '../state/store';
import type { VehicleConfig } from '../types';

const VEHICLE_FIELDS: { key: keyof VehicleConfig; label: string; min: number; max: number; step: number }[] = [
  { key: 'maxSpeed', label: 'Max speed', min: 4, max: 50, step: 0.5 },
  { key: 'maxReverseSpeed', label: 'Reverse speed', min: 2, max: 20, step: 0.5 },
  { key: 'acceleration', label: 'Acceleration', min: 2, max: 40, step: 0.5 },
  { key: 'brakeForce', label: 'Brake force', min: 5, max: 60, step: 1 },
  { key: 'turnRate', label: 'Turn rate', min: 0.5, max: 5, step: 0.1 },
  { key: 'friction', label: 'Friction', min: 0.2, max: 5, step: 0.1 },
  { key: 'grip', label: 'Grip', min: 0.3, max: 1, step: 0.01 },
  { key: 'handbrakeGripMultiplier', label: 'Handbrake grip', min: 0.05, max: 1, step: 0.01 },
];

export function ConfigMenu() {
  const tileTypes = useGameStore((s) => s.tileTypes);
  const overrides = useGameStore((s) => s.tileTextureOverrides);
  const setOverride = useGameStore((s) => s.setTileTextureOverride);
  const vehicleConfigs = useGameStore((s) => s.vehicleConfigs);
  const updateVehicleConfig = useGameStore((s) => s.updateVehicleConfig);

  const exportVehicles = () => {
    const blob = new Blob([JSON.stringify(Object.values(vehicleConfigs), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vehicle-configs.json';
    a.click();
  };

  return (
    <div className="config-menu">
      <section>
        <h2>Tile Textures</h2>
        <p className="hint">Upload a PNG per tile type — applies live to the game map.</p>
        <div className="tile-list">
          {tileTypes.map((t) => (
            <div key={t.id} className="tile-row">
              <span className="tile-swatch" style={{
                background: overrides[t.id] ? `url(${overrides[t.id]}) center/cover` : t.color,
              }} />
              <span className="tile-name">{t.name}</span>
              <label className="upload-inline">PNG
                <input type="file" accept="image/png,image/jpeg" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setOverride(t.id, URL.createObjectURL(f));
                }} />
              </label>
              {overrides[t.id] && (
                <button onClick={() => setOverride(t.id, null)}>Reset</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Vehicle Handling <button onClick={exportVehicles}>Export JSON</button></h2>
        <p className="hint">Live-applies to the running game (no respawn needed).</p>
        {Object.values(vehicleConfigs).map((cfg) => (
          <details key={cfg.presetId}>
            <summary>{cfg.name}</summary>
            {VEHICLE_FIELDS.map((f) => (
              <div key={f.key} className="slider-row">
                <span>{f.label}</span>
                <input type="range" min={f.min} max={f.max} step={f.step}
                  value={cfg[f.key] as number}
                  onChange={(e) => updateVehicleConfig({ ...cfg, [f.key]: parseFloat(e.target.value) })} />
                <span className="val">{(cfg[f.key] as number).toFixed(2)}</span>
              </div>
            ))}
          </details>
        ))}
      </section>
    </div>
  );
}
