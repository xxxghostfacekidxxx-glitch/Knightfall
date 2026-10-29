import type { VehicleConfig } from '../types';
import type { CollisionGrid } from './collision';

export interface VehicleState {
  x: number;
  z: number;
  heading: number; // radians, 0 = +Z
  /** Signed forward speed (negative = reversing) */
  speed: number;
  /** Lateral velocity for drift */
  lateral: number;
}

export interface VehicleInput {
  throttle: number; // -1..1
  steer: number; // -1..1 (1 = left)
  handbrake: boolean;
}

/** Off-road speed multiplier applied to max speed on non-drivable tiles */
const OFFROAD_FACTOR = 0.45;

export function stepVehicle(
  state: VehicleState,
  input: VehicleInput,
  cfg: VehicleConfig,
  grid: CollisionGrid,
  dt: number,
): VehicleState {
  let { x, z, heading, speed, lateral } = state;

  const onRoad = grid.isDrivableAt(x, z);
  const maxFwd = cfg.maxSpeed * (onRoad ? 1 : OFFROAD_FACTOR);
  const maxRev = cfg.maxReverseSpeed * (onRoad ? 1 : OFFROAD_FACTOR);

  // Longitudinal
  if (input.throttle > 0) {
    speed += cfg.acceleration * input.throttle * dt;
  } else if (input.throttle < 0) {
    // brake first, then reverse
    if (speed > 0.5) speed -= cfg.brakeForce * dt;
    else speed += cfg.acceleration * 0.6 * input.throttle * dt;
  } else {
    // coast friction
    const decel = cfg.friction * dt;
    if (Math.abs(speed) < decel * 4) speed *= Math.max(0, 1 - 6 * dt);
    else speed -= Math.sign(speed) * decel * 4;
  }
  if (input.handbrake) speed -= Math.sign(speed) * cfg.brakeForce * 0.8 * dt;
  speed = Math.min(maxFwd, Math.max(-maxRev, speed));

  // Steering scales with speed so the car doesn't spin in place
  const speedRatio = Math.min(1, Math.abs(speed) / cfg.maxSpeed);
  const steerEffect = cfg.turnRate * input.steer * speedRatio * Math.sign(speed || 1);
  heading += steerEffect * dt;

  // Lateral slip: turning sheds some forward velocity into lateral
  const grip = input.handbrake ? cfg.grip * cfg.handbrakeGripMultiplier : cfg.grip;
  lateral += steerEffect * Math.abs(speed) * 0.12 * dt * (1 - grip) * 60;
  lateral *= Math.max(0, 1 - grip * 8 * dt);

  // Integrate
  const sin = Math.sin(heading);
  const cos = Math.cos(heading);
  const prevX = x;
  const prevZ = z;
  x += (sin * speed + cos * lateral) * dt;
  z += (cos * speed - sin * lateral) * dt;

  // Collision: sample circle approximating the car body
  const radius = Math.max(cfg.halfExtents.x, cfg.halfExtents.z) * 0.75;
  const [rx, rz] = grid.resolveCircle(x, z, radius, prevX, prevZ);
  if (rx !== x || rz !== z) {
    // crashed into something — kill most velocity
    speed *= -0.25;
    lateral = 0;
  }

  return { x: rx, z: rz, heading, speed, lateral };
}
