import { useHudStore } from '../state/hudStore';

export function HUD() {
  const hud = useHudStore();
  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-health" style={{ color: hud.health > 30 ? '#7be37b' : '#e85a4a' }}>
          ♥ {Math.max(0, Math.round(hud.health))}
        </span>
        <span className="hud-score">★ {hud.score}</span>
      </div>
      <div className="hud-row">
        {hud.inVehicle
          ? <span>🚗 {Math.round(hud.speed * 3.6)} km/h — E to exit, Space handbrake</span>
          : hud.weapon
            ? <span>🔫 {hud.weapon} ({hud.ammo}) — Space to fire</span>
            : <span>WASD move · E enter car</span>}
      </div>
    </div>
  );
}
