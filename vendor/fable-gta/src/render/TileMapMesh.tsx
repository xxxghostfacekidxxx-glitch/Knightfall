import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MapData, TileType, TileTypeId } from '../types';
import { TILE_SIZE } from '../config/constants';
import { generateTileTexture, textureFromImageUrl } from './proceduralTextures';
import { useGameStore } from '../state/store';

interface TileMapMeshProps {
  map: MapData;
}

interface TileBatch {
  tile: TileType;
  mesh: THREE.InstancedMesh;
}

/**
 * One InstancedMesh per tile type (performance rule #5).
 * Texture overrides from the config menu swap only the material map.
 */
export function TileMapMesh({ map }: TileMapMeshProps) {
  const tileTypes = useGameStore((s) => s.tileTypes);
  const overrides = useGameStore((s) => s.tileTextureOverrides);

  const batches = useMemo<TileBatch[]>(() => {
    const counts = new Map<TileTypeId, number>();
    for (const id of map.tiles) counts.set(id, (counts.get(id) ?? 0) + 1);

    const result: TileBatch[] = [];
    const dummy = new THREE.Object3D();

    for (const tile of tileTypes) {
      const count = counts.get(tile.id) ?? 0;
      if (count === 0) continue;

      const h = Math.max(0.02, Math.abs(tile.height));
      const geo = new THREE.BoxGeometry(TILE_SIZE, h, TILE_SIZE);
      const mat = new THREE.MeshStandardMaterial({
        map: generateTileTexture(tile),
        roughness: 0.9,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.castShadow = tile.height > 0.5;
      mesh.receiveShadow = true;

      let i = 0;
      for (let tz = 0; tz < map.height; tz++) {
        for (let tx = 0; tx < map.width; tx++) {
          if (map.tiles[tz * map.width + tx] !== tile.id) continue;
          dummy.position.set(
            tx * TILE_SIZE + TILE_SIZE / 2,
            tile.height >= 0 ? tile.height / 2 : tile.height,
            tz * TILE_SIZE + TILE_SIZE / 2,
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i++, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      result.push({ tile, mesh });
    }
    return result;
  }, [map, tileTypes]);

  // Runtime material swap when a PNG override is set/cleared (rule #13).
  // Three.js materials are external mutable objects — mutation here is the
  // whole point (swap only the texture, never rebuild the InstancedMesh).
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    for (const { tile, mesh } of batches) {
      const url = overrides[tile.id];
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (url) {
        textureFromImageUrl(url).then((tex) => {
          material.map = tex;
          material.needsUpdate = true;
        });
      } else {
        material.map = generateTileTexture(tile);
        material.needsUpdate = true;
      }
    }
  }, [overrides, batches]);
  /* eslint-enable react-hooks/immutability */

  // Dispose on unmount/rebuild
  useEffect(() => {
    return () => {
      for (const { mesh } of batches) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    };
  }, [batches]);

  return (
    <>
      {batches.map(({ tile, mesh }) => (
        <primitive key={tile.id} object={mesh} />
      ))}
    </>
  );
}
