import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../state/store';
import { EditorScene, type GizmoMode } from '../scenes/EditorScene';
import { CAMERA, TILE_SIZE } from '../config/constants';
import type { AssetPreset, PresetTransform } from '../types';

const AXES = ['x', 'y', 'z'] as const;

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      <input type="number" step={step} value={Number(value.toFixed(3))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    </div>
  );
}

export function AssetEditorPanel() {
  const presets = useGameStore((s) => s.presets);
  const editingId = useGameStore((s) => s.editingPresetId);
  const setEditingId = useGameStore((s) => s.setEditingPresetId);
  const updatePreset = useGameStore((s) => s.updatePreset);
  const resetPreset = useGameStore((s) => s.resetPreset);
  const bumpPresetVersion = useGameStore((s) => s.bumpPresetVersion);

  const saved = presets[editingId];
  const [draft, setDraft] = useState<AssetPreset>(saved);
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');

  // Derive draft from the selected preset (render-phase reset, not an effect)
  const [lastEditingId, setLastEditingId] = useState(editingId);
  if (lastEditingId !== editingId) {
    setLastEditingId(editingId);
    setDraft(presets[editingId]);
  }

  if (!saved) return null;

  const setTransform = (t: PresetTransform) => setDraft({ ...draft, transform: t });
  const setAxis = (group: keyof PresetTransform, axis: 'x' | 'y' | 'z', v: number) =>
    setTransform({ ...draft.transform, [group]: { ...draft.transform[group], [axis]: v } });

  const onUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setDraft({ ...draft, modelUrl: url });
  };

  const save = () => {
    updatePreset(draft);
    bumpPresetVersion(); // hot-apply: GameScene respawns assets with new preset
  };

  const exportPresets = () => {
    const blob = new Blob([JSON.stringify(Object.values(presets), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'asset-presets.json';
    a.click();
  };

  const importPresets = (file: File) => {
    file.text().then((txt) => {
      useGameStore.getState().importPresets(JSON.parse(txt) as AssetPreset[]);
      bumpPresetVersion();
    });
  };

  const camDist = TILE_SIZE * 4;

  return (
    <div className="editor-layout">
      <div className="editor-viewport">
        <Canvas
          shadows
          camera={{
            position: [TILE_SIZE * 3.5 + camDist * 0.5, camDist * 0.8, TILE_SIZE * 3.5 + camDist * 0.6],
            fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far,
          }}
        >
          <color attach="background" args={['#15161c']} />
          <EditorScene gizmoMode={gizmoMode} draft={draft} onDraftTransform={setTransform} />
        </Canvas>
      </div>

      <div className="editor-panel">
        <h2>Asset Editor</h2>
        <label>Asset
          <select value={editingId} onChange={(e) => setEditingId(e.target.value)}>
            {Object.values(presets).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
            ))}
          </select>
        </label>

        <label className="upload">Upload GLB
          <input type="file" accept=".glb,.gltf" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }} />
        </label>
        {draft.modelUrl && (
          <button onClick={() => setDraft({ ...draft, modelUrl: '' })}>Use built-in model</button>
        )}

        <div className="gizmo-modes">
          {(['translate', 'rotate', 'scale'] as GizmoMode[]).map((m) => (
            <button key={m} className={gizmoMode === m ? 'active' : ''} onClick={() => setGizmoMode(m)}>{m}</button>
          ))}
        </div>

        <h3>Position</h3>
        {AXES.map((a) => (
          <SliderRow key={a} label={a.toUpperCase()} value={draft.transform.position[a]}
            min={-5} max={5} step={0.01} onChange={(v) => setAxis('position', a, v)} />
        ))}
        <h3>Rotation (rad)</h3>
        {AXES.map((a) => (
          <SliderRow key={a} label={a.toUpperCase()} value={draft.transform.rotation[a]}
            min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => setAxis('rotation', a, v)} />
        ))}
        <h3>Scale</h3>
        {AXES.map((a) => (
          <SliderRow key={a} label={a.toUpperCase()} value={draft.transform.scale[a]}
            min={0.05} max={5} step={0.01} onChange={(v) => setAxis('scale', a, v)} />
        ))}

        <div className="editor-actions">
          <button className="primary" onClick={save}>Save & Apply to Game</button>
          <button onClick={() => {
            resetPreset(editingId);
            setDraft(useGameStore.getState().presets[editingId]);
            bumpPresetVersion();
          }}>Reset to Default</button>
        </div>
        <div className="editor-actions">
          <button onClick={exportPresets}>Export JSON</button>
          <label className="upload-inline">Import JSON
            <input type="file" accept=".json" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importPresets(f);
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}
