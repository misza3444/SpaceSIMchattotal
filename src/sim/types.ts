export type Vec3 = [number, number, number];
export interface Entity { id: number; transform?: { position: Vec3 }; motion?: { velocity: Vec3 } }
export interface WorldState {
  schemaVersion: 1; seed: number; rngState: number; tick: number;
  nextEntityId: number; entities: Entity[];
}
export type Command = { type: 'spawnProbe'; position?: Vec3 };
export type SimEvent = { type: 'entitySpawned'; entityId: number } | { type: 'tick'; tick: number };
