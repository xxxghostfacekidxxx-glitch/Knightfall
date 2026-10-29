import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { useGameStore } from '../state/store';
import { SceneEnvironment } from '../render/SceneEnvironment';
import { TileMapMesh } from '../render/TileMapMesh';
import { AssetInstance } from '../render/AssetInstance';
import { TILE_SIZE } from '../config/constants';
import type { MapData, TileTypeId } from '../types';
import type { AssetPreset } from '../types';

// Representative preview map: road crossing + sidewalk + building corner
// (rule #12). Built from the SAME tile system as the real game.
function buildPreviewMap(): MapData {
  const legend: Record<string, TileTypeId> = {
    '-': 'road_h', '|': 'road_v', '+': 'intersection', s: 'sidewalk', g: 'grass', B: 'building',
  };
  const rows = ['sssssss', 'sBBs|gs', 'ssss|ss', '----+--', 'ssss|ss', 'sggs|Bs', 'sssssss'];
  const tiles = rows.flatMap((r) => [...r].map((c) => legend[c]));
  return {
    name: 'preview', width: 7, height: 7, tiles,
    objects: [], playerSpawn: { position: { x: 0, y: 0, z: 0 }, rotationY: 0 },
    vehicleSpawns: [], pedestrianSpawns: [],
  };
}

export type GizmoMode = 'translate' | 'rotate' | 'scale';

interface EditorSceneProps {
  gizmoMode: GizmoMode;
  /** Live preset being edited (not yet saved) */
  draft: AssetPreset;
  onDraftTransform: (t: AssetPreset['transform']) => void;
}

export function EditorScene({ gizmoMode, draft, onDraftTransform }: EditorSceneProps) {
  const previewMap = useMemo(() => buildPreviewMap(), []);
  const center = (previewMap.width * TILE_SIZE) / 2;
  const orbitRef = useRef(null);
  // Gizmo target = the INNER preset group (where the preset transform lives),
  // so gizmo edits map 1:1 to preset values. Tracked via callback ref.
  const [target, setTarget] = useState<THREE.Object3D | null>(null);

  // The asset sits on the intersection center so positioning decisions make sense.
  const anchor: [number, number, number] = [center, 0, center];

  const handleChange = () => {
    const inner = target;
    if (!inner) return;
    onDraftTransform({
      position: { x: inner.position.x, y: inner.position.y, z: inner.position.z },
      rotation: { x: inner.rotation.x, y: inner.rotation.y, z: inner.rotation.z },
      scale: { x: inner.scale.x, y: inner.scale.y, z: inner.scale.z },
    });
  };

  return (
    <>
      <SceneEnvironment />
      <TileMapMesh map={previewMap} />
      <AssetInstance
        preset={draft}
        position={anchor}
        ref={(g: THREE.Group | null) => setTarget(g?.children[0] ?? null)}
      />
      {target && (
        <TransformControls
          object={target}
          mode={gizmoMode}
          showY
          showX={gizmoMode !== 'rotate'}
          showZ={gizmoMode !== 'rotate'}
          onObjectChange={handleChange}
          onMouseDown={() => {
            const o = orbitRef.current as { enabled: boolean } | null;
            if (o) o.enabled = false;
          }}
          onMouseUp={() => {
            const o = orbitRef.current as { enabled: boolean } | null;
            if (o) o.enabled = true;
          }}
        />
      )}
      <OrbitControls ref={orbitRef} target={anchor} makeDefault={false} />
      {/* human-scale reference */}
      <ReferenceFigure position={[anchor[0] + 3, 0, anchor[2] + 3]} />
    </>
  );
}

function ReferenceFigure({ position }: { position: [number, number, number] }) {
  const presets = useGameStore((s) => s.presets);
  const ref = useMemo(
    () => presets['player'] && { ...presets['player'], id: 'ref', builtin: 'pedestrian', modelUrl: '' },
    [presets],
  );
  if (!ref) return null;
  return <AssetInstance preset={ref} position={position} />;
}
