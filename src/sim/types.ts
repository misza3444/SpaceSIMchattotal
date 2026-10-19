export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];
export type TravelPhase = 'normal' | 'charging' | 'travel' | 'cooldown';
export interface FlightInput {
  strafe: number; lift: number; forward: number;
  pitch: number; yaw: number; roll: number; boost: boolean;
}
export interface PilotState {
  shipId: string; position: Vec3; velocity: Vec3; orientation: Quat;
  angularVelocity: Vec3; assist: boolean; boost: boolean;
  mode: TravelPhase; phaseTicks: number; selectedTarget: string | null;
}
export interface Entity { id: number; transform?: { position: Vec3 }; motion?: { velocity: Vec3 } }
export interface WorldState {
  schemaVersion: 1; seed: number; rngState: number; tick: number;
  nextEntityId: number; entities: Entity[]; pilot?: PilotState;
}
export type Command =
  | { type: 'spawnProbe'; position?: Vec3 }
  | { type: 'flightInput'; input: FlightInput }
  | { type: 'toggleAssist' }
  | { type: 'toggleTravel' }
  | { type: 'nextTarget' };
export type SimEvent = { type: 'entitySpawned'; entityId: number } | { type: 'tick'; tick: number }
  | { type: 'travelPhase'; phase: TravelPhase };
