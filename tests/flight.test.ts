import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../src/data/catalog';
import { changeTravelMode, makePilot, rotate, speed, stepFlight, travelProgress, unsafeForTravel, weaponsAvailable, ZERO_INPUT } from '../src/sim/flight';
import { Simulation, FIXED_DT } from '../src/sim/simulation';
const ship = loadCatalog().ships[0]!;
const bodies = loadCatalog().sector.bodies;
function steps(pilot: ReturnType<typeof makePilot>, input = ZERO_INPUT, n=120): void {
  for(let i=0;i<n;i++) stepFlight(pilot,input,ship,bodies,FIXED_DT);
}
describe('Stage 1: flight', () => {
  it('accelerates forward and brakes predictably with flight assist', () => {
    const p = makePilot(ship.id);
    steps(p,{...ZERO_INPUT,forward:1},150);
    expect(p.velocity[2]).toBeLessThan(-40);
    const before = speed(p.velocity);
    steps(p,ZERO_INPUT,150);
    expect(speed(p.velocity)).toBeLessThan(before);
    expect(speed(p.velocity)).toBeLessThan(0.1);
  });
  it('retains drift without flight assist', () => {
    const p = makePilot(ship.id); p.assist = false;
    steps(p,{...ZERO_INPUT,strafe:1},100);
    const initial = speed(p.velocity);
    steps(p,ZERO_INPUT,100);
    expect(speed(p.velocity)).toBeGreaterThan(initial*0.98);
  });
  it('provides pitch, yaw and roll with normalized quaternion', () => {
    const p = makePilot(ship.id);
    steps(p,{...ZERO_INPUT,pitch:0.6,yaw:0.7,roll:-0.3},60);
    expect(p.orientation[0]).not.toBe(0);
    expect(p.orientation[1]).not.toBe(0);
    expect(p.orientation[2]).not.toBe(0);
    expect(Math.hypot(...p.orientation)).toBeCloseTo(1,6);
    expect(rotate(p.orientation,[0,0,-1])).not.toEqual([0,0,-1]);
  });
  it('supports complete charging, travel and cooldown, then normal', () => {
    const p = makePilot(ship.id); p.position = [1500,0,0];
    changeTravelMode(p,ship,bodies);
    expect(p.mode).toBe('charging');
    expect(weaponsAvailable(p)).toBe(false);
    steps(p,ZERO_INPUT,Math.ceil(ship.travelChargeSeconds*60)+1);
    expect(p.mode).toBe('travel');
    expect(travelProgress(p,ship)).toBe(1);
    steps(p,ZERO_INPUT,120);
    expect(speed(p.velocity)).toBeGreaterThan(50);
    changeTravelMode(p,ship,bodies);
    expect(p.mode).toBe('cooldown');
    steps(p,ZERO_INPUT,Math.ceil(ship.travelCooldownSeconds*60)+1);
    expect(p.mode).toBe('normal');
    expect(weaponsAvailable(p)).toBe(true);
  });
  it('aborts travel when an obstacle is in the forward corridor', () => {
    const p = makePilot(ship.id);
    p.position = [0,-40,-500]; p.velocity = [0,0,-600];
    expect(unsafeForTravel(p,bodies,1000)).toBe(true);
    changeTravelMode(p,ship,bodies);
    expect(p.mode).toBe('normal');
    p.position=[1500,0,0]; p.velocity=[0,0,0];
    changeTravelMode(p,ship,bodies);
    p.position=[0,-40,-500]; p.mode='travel';
    stepFlight(p,ZERO_INPUT,ship,bodies,FIXED_DT);
    expect(p.mode).toBe('cooldown');
  });
  it('persists orientation, motion and target deterministically', () => {
    function run() {
      const sim=new Simulation(7);
      sim.commands.enqueue({ type:'flightInput', input: { ...ZERO_INPUT,forward:1,yaw:0.2 } });
      sim.commands.enqueue({ type:'nextTarget' });
      for(let i=0;i<180;i++)sim.step();
      const state=sim.snapshot();
      const resumed=new Simulation(7,state);
      expect(resumed.snapshot()).toEqual(state);
      return state;
    }
    expect(run()).toEqual(run());
  });
});
