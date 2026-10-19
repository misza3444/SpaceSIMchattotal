import type { FlightInput, PilotState, Quat, Vec3 } from './types';
export interface FlightShip {
  id: string; mass: number; thrust: number;
  thrusters: { strafe: number; lift: number; reverse: number };
  drag: Vec3; angularAcceleration: Vec3; angularDrag: number;
  maxAngularSpeed: number; assistBraking: number; boostMultiplier: number;
  maxSpeed: number; travelSpeed: number; travelAcceleration: number;
  travelChargeSeconds: number; travelCooldownSeconds: number;
}
export interface CollisionBody { id: string; position: Vec3; radius: number }
export const ZERO_INPUT: FlightInput = {
  strafe: 0, lift: 0, forward: 0, pitch: 0, yaw: 0, roll: 0, boost: false
};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const len = (v: Vec3) => Math.hypot(...v);
export const speed = (v: Vec3) => len(v);
export function multiply(a: Quat, b: Quat): Quat {
  const [x,y,z,w] = a, [X,Y,Z,W] = b;
  return [w*X+x*W+y*Z-z*Y, w*Y-x*Z+y*W+z*X, w*Z+x*Y-y*X+z*W, w*W-x*X-y*Y-z*Z];
}
export function normalize(q: Quat): Quat {
  const n = Math.hypot(...q) || 1;
  return [q[0]/n, q[1]/n, q[2]/n, q[3]/n];
}
export function conjugate(q: Quat): Quat { return [-q[0], -q[1], -q[2], q[3]]; }
export function rotate(q: Quat, v: Vec3): Vec3 {
  const [x,y,z,w] = q;
  // Optimised q * vector * q^-1, where q is a unit quaternion.
  const uv: Vec3 = [y*v[2]-z*v[1],z*v[0]-x*v[2],x*v[1]-y*v[0]];
  const uuv: Vec3 = [y*uv[2]-z*uv[1],z*uv[0]-x*uv[2],x*uv[1]-y*uv[0]];
  return add(v, add(scale(uv,2*w),scale(uuv,2)));
}
export function makePilot(shipId: string): PilotState {
  return { shipId, position: [0, 0, 160], velocity: [0, 0, 0],
    orientation: [0,0,0,1], angularVelocity: [0,0,0], assist: true,
    boost: false, mode: 'normal', phaseTicks: 0, selectedTarget: null };
}
export function unsafeForTravel(pilot: PilotState, bodies: CollisionBody[], lookAhead = 0): boolean {
  const forward = rotate(pilot.orientation, [0, 0, -1]);
  for (const body of bodies) {
    const delta: Vec3 = [body.position[0]-pilot.position[0],body.position[1]-pilot.position[1],body.position[2]-pilot.position[2]];
    const distance = len(delta), ahead = dot(delta, forward);
    const corridor = Math.sqrt(Math.max(0,distance*distance-ahead*ahead));
    if (ahead > -body.radius && ahead < Math.max(450,lookAhead) + body.radius
      && corridor < body.radius + 260) return true;
  }
  return false;
}
export function changeTravelMode(pilot: PilotState, ship: FlightShip, bodies: CollisionBody[]): void {
  if (pilot.mode === 'normal' && !unsafeForTravel(pilot,bodies,650)) {
    pilot.mode = 'charging'; pilot.phaseTicks = Math.max(1,Math.ceil(ship.travelChargeSeconds*60));
  } else if (pilot.mode === 'charging' || pilot.mode === 'travel') {
    pilot.mode = 'cooldown'; pilot.phaseTicks = Math.max(1,Math.ceil(ship.travelCooldownSeconds*60));
  }
}
export function stepFlight(pilot: PilotState, input: FlightInput, ship: FlightShip, bodies: CollisionBody[], dt: number): void {
  const axes = [input.pitch, input.yaw, input.roll];
  const angular = pilot.angularVelocity;
  for (let i=0;i<3;i++) {
    const command = clamp(axes[i] ?? 0,-1,1);
    angular[i] = clamp((angular[i] ?? 0) + command*(ship.angularAcceleration[i] ?? 0)*dt,
      -ship.maxAngularSpeed,ship.maxAngularSpeed);
    const damping = command === 0 && pilot.assist ? ship.angularDrag*8 : ship.angularDrag;
    angular[i] *= Math.exp(-damping * dt);
  }
  const [pitch,yaw,roll] = angular;
  const halfPitch=pitch*dt/2, halfYaw=-yaw*dt/2, halfRoll=-roll*dt/2;
  // Local nose: -Z. Positive pitch raises nose, positive yaw turns right.
  const delta = multiply(multiply([Math.sin(halfPitch),0,0,Math.cos(halfPitch)],
    [0,Math.sin(halfYaw),0,Math.cos(halfYaw)]),[0,0,Math.sin(halfRoll),Math.cos(halfRoll)]);
  pilot.orientation = normalize(multiply(pilot.orientation,delta));

  if (pilot.mode === 'charging') {
    pilot.phaseTicks--;
    if (unsafeForTravel(pilot,bodies,700)) {
      pilot.mode = 'cooldown'; pilot.phaseTicks = Math.max(1,Math.ceil(ship.travelCooldownSeconds*60));
    } else if (pilot.phaseTicks <= 0) {
      pilot.mode = 'travel'; pilot.phaseTicks = 0;
    }
  } else if (pilot.mode === 'cooldown') {
    pilot.phaseTicks--;
    if (pilot.phaseTicks <= 0) { pilot.mode = 'normal'; pilot.phaseTicks = 0; }
  }
  const movingTravel = pilot.mode === 'travel';
  pilot.boost = input.boost && pilot.mode === 'normal';
  const forceMultiplier = pilot.boost ? ship.boostMultiplier : 1;
  const localVelocity = rotate(conjugate(pilot.orientation),pilot.velocity);
  if (movingTravel) {
    const dir = rotate(pilot.orientation,[0,0,-1]);
    // Travel converges towards current heading; max speed remains bounded.
    const desired = scale(dir,ship.travelSpeed);
    const difference: Vec3 = [desired[0]-pilot.velocity[0],desired[1]-pilot.velocity[1],desired[2]-pilot.velocity[2]];
    const mag = len(difference), step = Math.min(mag,ship.travelAcceleration*dt);
    if (mag>0) pilot.velocity = add(pilot.velocity,scale(difference,step/mag));
    if (unsafeForTravel(pilot,bodies,Math.max(550,speed(pilot.velocity)*1.4))) {
      pilot.mode = 'cooldown'; pilot.phaseTicks = Math.max(1,Math.ceil(ship.travelCooldownSeconds*60));
    }
  } else {
    const localInput: Vec3 = [clamp(input.strafe,-1,1),clamp(input.lift,-1,1),clamp(input.forward,-1,1)];
    const acc: Vec3 = [
      localInput[0] * ship.thrusters.strafe / ship.mass * forceMultiplier,
      localInput[1] * ship.thrusters.lift / ship.mass * forceMultiplier,
      -(localInput[2] >= 0 ? localInput[2]*ship.thrust : localInput[2]*ship.thrusters.reverse) / ship.mass * forceMultiplier
    ];
    for (let i=0;i<3;i++) {
      if (pilot.assist && Math.abs(localInput[i] ?? 0) < 0.001) {
        const v = localVelocity[i] ?? 0;
        acc[i] += -Math.sign(v)*Math.min(Math.abs(v)/dt,ship.assistBraking);
      }
      acc[i] -= (localVelocity[i] ?? 0)*(ship.drag[i] ?? 0);
    }
    pilot.velocity = add(pilot.velocity,scale(rotate(pilot.orientation,acc),dt));
    const maxSpeed = ship.maxSpeed * (pilot.boost ? ship.boostMultiplier : 1);
    const magnitude = len(pilot.velocity);
    if (magnitude > maxSpeed) pilot.velocity = scale(pilot.velocity,maxSpeed/magnitude);
  }
  pilot.position = add(pilot.position,scale(pilot.velocity,dt));
}
export function travelProgress(pilot: PilotState, ship: FlightShip): number {
  if (pilot.mode === 'travel') return 1;
  if (pilot.mode !== 'charging') return 0;
  return 1 - pilot.phaseTicks/Math.max(1,Math.ceil(ship.travelChargeSeconds*60));
}
export function weaponsAvailable(pilot: PilotState): boolean {
  return pilot.mode === 'normal' || pilot.mode === 'cooldown';
}
