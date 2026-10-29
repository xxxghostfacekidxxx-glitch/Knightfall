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
import './App.css';

export default function App() {
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const setMap = useGameStore((s) => s.setMap);

  useEffect(() => initInput(), []);

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
        <span className="logo">GTA-2W</span>
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
