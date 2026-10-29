import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from './state/store';
import { GameScene } from './scenes/GameScene';
import { AssetEditorPanel } from './ui/AssetEditorPanel';
import { ConfigMenu } from './ui/ConfigMenu';
import { HUD } from './ui/HUD';
import { initInput } from './game/input';
import { CAMERA } from './config/constants';
import { importTiledMap } from './tiled/importTiled';
import { parseMap } from './game/mapLoader';
import type { MapData, TileTypeId } from './types';
import './App.css';

export default function App() {
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const setMap = useGameStore((s) => s.setMap);

  useEffect(() => initInput(), []);
  useEffect(() => {
    const loadCityForge = () => {
      try {
        const text = localStorage.getItem('ashfall-city-forge-map-v1');
        if (!text) return;
        const raw: unknown = JSON.parse(text);
        if (!raw || typeof raw !== 'object') return;
        const m = raw as Record<string, unknown>;
        const legend = m.legend as Record<string, TileTypeId> | undefined;
        const rows = m.rows;
        if (!legend || !Array.isArray(rows) || rows.length < 4 || rows.length > 128 ||
            !rows.every((r) => typeof r === 'string' && r.length === rows[0].length && r.length <= 128 &&
              [...r].every((ch) => typeof legend[ch] === 'string'))) return;
        const city = parseMap(raw as Parameters<typeof parseMap>[0]);
        setMap(city as MapData);
        localStorage.removeItem('ashfall-city-forge-map-v1');
      } catch (error) {
        console.warn('City Forge map could not be loaded', error);
      }
    };
    loadCityForge();
    window.addEventListener('storage', loadCityForge);
    return () => window.removeEventListener('storage', loadCityForge);
  }, [setMap]);

  const onTiledImport = (file: File) => {
    file.text().then((txt) => {
      try {
        setMap(importTiledMap(JSON.parse(txt)));
        setMode('game');
      } catch (err) {
        alert(`Tiled import failed: ${(err as Error).message}`);
      }
    });
  };

  return (
    <div className="app">
      <nav className="topbar">
        <span className="logo">ASH-FALL CITY</span>
        <a href="/arcade/city-forge.html" style={{ color: "#c6ff45", padding: "8px" }}>City Forge ↗</a>
        {(['game', 'editor', 'config'] as const).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {m === 'game' ? 'Play' : m === 'editor' ? 'Asset Editor' : 'Config'}
          </button>
        ))}
        <label className="upload-inline topbar-import">Import Tiled .tmj
          <input type="file" accept=".tmj,.json" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onTiledImport(f);
          }} />
        </label>
      </nav>

      {/* Game canvas stays mounted in all modes so config changes hot-apply */}
      <div className="game-root" style={{ display: mode === 'editor' ? 'none' : 'block' }}>
        <Canvas
          shadows
          camera={{ position: [0, CAMERA.height, 0], fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far }}
        >
          <color attach="background" args={['#0d0e12']} />
          <GameScene />
        </Canvas>
        {mode === 'game' && <HUD />}
        {mode === 'config' && (
          <div className="overlay-panel">
            <ConfigMenu />
          </div>
        )}
      </div>

      {mode === 'editor' && <AssetEditorPanel />}
    </div>
  );
}
