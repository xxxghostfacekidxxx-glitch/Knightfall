import { LIGHTING } from '../config/constants';

/**
 * Shared lighting rig. Used by BOTH GameScene and the Asset Editor preview —
 * never duplicate these values elsewhere (Golden Rule).
 */
export function SceneEnvironment() {
  return (
    <>
      <ambientLight intensity={LIGHTING.ambientIntensity} color={LIGHTING.ambientColor} />
      <directionalLight
        position={LIGHTING.sunPosition}
        intensity={LIGHTING.sunIntensity}
        color={LIGHTING.sunColor}
        castShadow
        shadow-mapSize-width={LIGHTING.shadowMapSize}
        shadow-mapSize-height={LIGHTING.shadowMapSize}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={200}
      />
    </>
  );
}
