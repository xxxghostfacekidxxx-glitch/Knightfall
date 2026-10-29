import { useEffect, useRef, useState, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AssetPreset } from '../types';
import { WORLD_SCALE } from '../config/constants';
import { createBuiltinModel } from './builtinModels';

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, THREE.Group>();

async function loadModel(preset: AssetPreset): Promise<THREE.Group> {
  if (!preset.modelUrl) return createBuiltinModel(preset.builtin);
  const cached = modelCache.get(preset.modelUrl);
  if (cached) return cached.clone(true);
  const gltf = await gltfLoader.loadAsync(preset.modelUrl);
  const scene = gltf.scene;
  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  modelCache.set(preset.modelUrl, scene);
  return scene.clone(true);
}

export interface AssetInstanceProps {
  preset: AssetPreset;
  /** World placement from map data — applied on the OUTER group */
  position?: [number, number, number];
  rotationY?: number;
  visible?: boolean;
}

/**
 * Mandatory spawning pattern:
 *   outer Group  <- world position/rotation from map data
 *     preset Group <- preset transform (user-adjusted in the editor)
 *       model       <- loaded GLTF or builtin, never mutated
 */
export const AssetInstance = forwardRef<THREE.Group, AssetInstanceProps>(
  function AssetInstance({ preset, position = [0, 0, 0], rotationY = 0, visible = true }, ref) {
    const [model, setModel] = useState<THREE.Group | null>(null);
    const presetGroupRef = useRef<THREE.Group>(null);

    useEffect(() => {
      let cancelled = false;
      loadModel(preset).then((m) => {
        if (!cancelled) setModel(m);
      });
      return () => {
        cancelled = true;
      };
    }, [preset.modelUrl, preset.builtin]); // eslint-disable-line react-hooks/exhaustive-deps

    const t = preset.transform;

    return (
      <group ref={ref} position={position} rotation={[0, rotationY, 0]} visible={visible} scale={WORLD_SCALE}>
        <group
          ref={presetGroupRef}
          position={[t.position.x, t.position.y, t.position.z]}
          rotation={[t.rotation.x, t.rotation.y, t.rotation.z]}
          scale={[t.scale.x, t.scale.y, t.scale.z]}
        >
          {model && <primitive object={model} />}
        </group>
      </group>
    );
  },
);
