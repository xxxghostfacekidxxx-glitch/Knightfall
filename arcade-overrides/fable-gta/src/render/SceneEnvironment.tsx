import { LIGHTING } from '../config/constants';

// Ash-Fall nocturnal neon city. Shared by gameplay and asset editor.
export function SceneEnvironment() {
  return (
    <>
      <ambientLight intensity={0.82} color="#8174b9" />
      <hemisphereLight args={['#7ce7ef', '#23132d', 1.15]} />
      <directionalLight
        position={LIGHTING.sunPosition}
        intensity={1.3}
        color="#dfd1ff"
        castShadow
        shadow-mapSize-width={LIGHTING.shadowMapSize}
        shadow-mapSize-height={LIGHTING.shadowMapSize}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={200}
      />
      <directionalLight position={[-38, 25, -22]} intensity={0.85} color="#ff4ebf" />
      <directionalLight position={[25, 14, 38]} intensity={0.75} color="#b8ff40" />
      <fog attach="fog" args={['#100d20', 85, 240]} />
    </>
  );
}
