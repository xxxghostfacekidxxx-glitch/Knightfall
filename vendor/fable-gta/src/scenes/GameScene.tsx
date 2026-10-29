import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state/store';
import { World } from '../game/world';
import { isDown, consumePress, clearFramePresses } from '../game/input';
import { CAMERA } from '../config/constants';
import { SceneEnvironment } from '../render/SceneEnvironment';
import { TileMapMesh } from '../render/TileMapMesh';
import { AssetInstance } from '../render/AssetInstance';
import { useHudStore } from '../state/hudStore';

const _camTarget = new THREE.Vector3();

export function GameScene() {
  const map = useGameStore((s) => s.map);
  const tileTypes = useGameStore((s) => s.tileTypes);
  const presets = useGameStore((s) => s.presets);
  const vehicleConfigs = useGameStore((s) => s.vehicleConfigs);
  const weaponConfigs = useGameStore((s) => s.weaponConfigs);
  const presetVersion = useGameStore((s) => s.presetVersion);

  const world = useMemo(
    () => new World(map, tileTypes, vehicleConfigs, weaponConfigs),
    // vehicleConfigs is captured by reference inside World; live tuning still
    // applies because the store mutates the same record objects on update.
    [map, tileTypes], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // keep latest configs without respawning the world (Three/game objects are
  // external mutable systems — safe to sync in an effect)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    world.vehicleConfigs = vehicleConfigs;
  }, [world, vehicleConfigs]);

  const playerRef = useRef<THREE.Group>(null);
  const vehicleRefs = useRef(new Map<number, THREE.Group>());
  const pedRefs = useRef(new Map<number, THREE.Group>());
  const projectileMeshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  // low-rate re-render for alive/taken flags
  const [, setTick] = useState(0);
  const tickAccum = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const input = {
      forward: (isDown('KeyW') || isDown('ArrowUp') ? 1 : 0) + (isDown('KeyS') || isDown('ArrowDown') ? -1 : 0),
      steer: (isDown('KeyA') || isDown('ArrowLeft') ? 1 : 0) + (isDown('KeyD') || isDown('ArrowRight') ? -1 : 0),
      handbrake: isDown('Space') && world.player.inVehicle !== null,
      fire: isDown('Space') && world.player.inVehicle === null,
      interact: consumePress('KeyE'),
    };
    world.step(input, dt);
    clearFramePresses();

    // sync player
    const p = world.player;
    if (playerRef.current) {
      playerRef.current.position.set(p.x, 0, p.z);
      playerRef.current.rotation.y = p.heading;
      playerRef.current.visible = p.inVehicle === null;
    }
    // sync vehicles
    for (const v of world.vehicles) {
      const g = vehicleRefs.current.get(v.id);
      if (g) {
        g.position.set(v.state.x, 0, v.state.z);
        g.rotation.y = v.state.heading;
      }
    }
    // sync peds
    for (const ped of world.peds) {
      const g = pedRefs.current.get(ped.id);
      if (g) {
        g.position.set(ped.x, 0, ped.z);
        g.rotation.y = ped.heading;
      }
    }
    // sync projectiles
    const pm = projectileMeshRef.current;
    if (pm) {
      const dummy = new THREE.Object3D();
      const n = Math.min(world.projectiles.length, 64);
      for (let i = 0; i < n; i++) {
        const pr = world.projectiles[i];
        dummy.position.set(pr.x, 1.1, pr.z);
        dummy.updateMatrix();
        pm.setMatrixAt(i, dummy.matrix);
      }
      pm.count = n;
      pm.instanceMatrix.needsUpdate = true;
    }

    // camera follow (top-down, slight lag)
    _camTarget.set(p.x, CAMERA.height, p.z - CAMERA.lag);
    camera.position.lerp(_camTarget, Math.min(1, CAMERA.followLerp * dt));
    camera.lookAt(p.x, 0, p.z);

    // HUD + slow re-render
    tickAccum.current += dt;
    if (tickAccum.current > 0.15) {
      tickAccum.current = 0;
      setTick((t) => t + 1);
      useHudStore.getState().update({
        health: p.health,
        weapon: p.weaponId,
        ammo: p.ammo,
        score: world.score,
        inVehicle: p.inVehicle !== null,
        speed: p.inVehicle !== null
          ? Math.abs(world.vehicles.find((v) => v.id === p.inVehicle)?.state.speed ?? 0)
          : 0,
      });
    }
  });

  const pedPreset = presets['player'] && {
    ...presets['player'],
    id: 'pedestrian',
    builtin: 'pedestrian',
    modelUrl: '',
  };

  return (
    <group key={presetVersion}>
      <SceneEnvironment />
      <TileMapMesh map={map} />

      {/* player on foot */}
      <AssetInstance preset={presets['player']} ref={playerRef} />

      {/* vehicles */}
      {world.vehicles.filter((v) => v.alive).map((v) => (
        <AssetInstance
          key={v.id}
          preset={presets[v.presetId]}
          ref={(g) => {
            if (g) vehicleRefs.current.set(v.id, g);
            else vehicleRefs.current.delete(v.id);
          }}
        />
      ))}

      {/* wrecks */}
      {world.vehicles.filter((v) => !v.alive).map((v) => (
        <mesh key={`wreck-${v.id}`} position={[v.state.x, 0.4, v.state.z]} rotation={[0, v.state.heading, 0]}>
          <boxGeometry args={[1.8, 0.7, 4]} />
          <meshStandardMaterial color="#1c1c1c" roughness={1} />
        </mesh>
      ))}

      {/* pedestrians */}
      {pedPreset && world.peds.filter((pd) => pd.alive).map((pd) => (
        <AssetInstance
          key={pd.id}
          preset={pedPreset}
          ref={(g) => {
            if (g) pedRefs.current.set(pd.id, g);
            else pedRefs.current.delete(pd.id);
          }}
        />
      ))}

      {/* static map objects (skip consumed barrels/pickups) */}
      {map.objects.map((o, i) => {
        if (o.presetId === 'barrel') {
          const b = world.barrels.find((b) => Math.abs(b.x - o.position.x) < 0.01 && Math.abs(b.z - o.position.z) < 0.01);
          if (b && !b.alive) return null;
        }
        if (weaponConfigs[o.presetId]) {
          const pk = world.pickups.find((p) => Math.abs(p.x - o.position.x) < 0.01 && Math.abs(p.z - o.position.z) < 0.01);
          if (pk?.taken) return null;
          return (
            <AssetInstance
              key={i}
              preset={presets[o.presetId]}
              position={[o.position.x, o.position.y, o.position.z]}
              rotationY={o.rotationY}
            />
          );
        }
        return (
          <AssetInstance
            key={i}
            preset={presets[o.presetId]}
            position={[o.position.x, o.position.y, o.position.z]}
            rotationY={o.rotationY}
          />
        );
      })}

      {/* projectiles */}
      <instancedMesh ref={projectileMeshRef} args={[undefined, undefined, 64]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#ffd866" />
      </instancedMesh>
    </group>
  );
}
