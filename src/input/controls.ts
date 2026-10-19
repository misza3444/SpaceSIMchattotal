import type { FlightInput } from '../sim/types';
import { ZERO_INPUT } from '../sim/flight';

export const DEFAULT_BINDINGS = {
  forward:'KeyW', backward:'KeyS', left:'KeyA', right:'KeyD',
  up:'Space', down:'ControlLeft', pitchUp:'ArrowUp', pitchDown:'ArrowDown',
  yawLeft:'ArrowLeft', yawRight:'ArrowRight', rollLeft:'KeyQ', rollRight:'KeyE',
  boost:'ShiftLeft', assist:'KeyF', travel:'KeyT', camera:'KeyV', target:'Tab'
} as const;
export type Action = keyof typeof DEFAULT_BINDINGS;
export type Bindings = Record<Action,string>;
export type OneShot = 'assist' | 'travel' | 'camera' | 'target';
export interface SampledControls { input: FlightInput; actions: OneShot[]; gamepad: boolean }
const axes = (v: number) => Math.abs(v) < 0.15 ? 0 : Math.sign(v)*(Math.abs(v)-0.15)/0.85;
const clamp = (v: number) => Math.min(1,Math.max(-1,v));
function storedBindings(): Bindings {
  const base: Bindings = {...DEFAULT_BINDINGS};
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('spacesim-bindings-v1') ?? '{}');
    if (saved && typeof saved === 'object') {
      for(const action of Object.keys(base) as Action[]) {
        const code = (saved as Record<string,unknown>)[action];
        if (typeof code === 'string' && code.length <= 40) base[action] = code;
      }
    }
  } catch { /* Private mode: defaults remain available. */ }
  return base;
}
export class FlightControls {
  private readonly held = new Set<string>();
  private readonly pressed = new Set<OneShot>();
  private readonly padPrevious = new Set<OneShot>();
  private bindings = storedBindings();
  private remapping: Action | null = null;
  private onRemap: (()=>void) | null = null;
  private mouseX=0; private mouseY=0;
  constructor(private readonly canvas: HTMLElement) {
    window.addEventListener('keydown',this.keyDown);
    window.addEventListener('keyup',this.keyUp);
    window.addEventListener('blur',this.clear);
    document.addEventListener('mousemove',this.mouseMove);
    canvas.addEventListener('click',this.lockMouse);
  }
  getBindings(): Bindings { return {...this.bindings}; }
  beginRemap(action: Action, done: () => void): void {
    this.remapping=action; this.onRemap=done; this.held.clear(); this.pressed.clear();
  }
  cancelRemap(): void { this.remapping=null; this.onRemap=null; }
  isLocked(): boolean { return document.pointerLockElement === this.canvas; }
  private lockMouse = (): void => {
    if (this.remapping || this.isLocked()) return;
    try { void this.canvas.requestPointerLock().catch(()=>{}); } catch { /* Pointer lock optional. */ }
  };
  private keyDown = (event: KeyboardEvent): void => {
    if(this.remapping) {
      event.preventDefault();
      if(event.code !== 'Escape'){
        this.bindings[this.remapping] = event.code;
        try {localStorage.setItem('spacesim-bindings-v1',JSON.stringify(this.bindings));} catch { /* no persistence */ }
      }
      this.remapping=null;
      this.onRemap?.();
      this.onRemap=null;
      return;
    }
    if(event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button')) return;
    const action = (Object.keys(this.bindings) as Action[]).find(k=>this.bindings[k]===event.code);
    if(!action) return;
    if(event.code==='Tab'||event.code.startsWith('Arrow')||event.code==='Space')event.preventDefault();
    if(!event.repeat && (['assist','travel','camera','target'] as Action[]).includes(action))
      this.pressed.add(action as OneShot);
    this.held.add(event.code);
  };
  private keyUp = (event: KeyboardEvent):void => {this.held.delete(event.code);};
  private mouseMove = (event:MouseEvent):void => {
    if (!this.isLocked())return;
    this.mouseX += event.movementX;
    this.mouseY += event.movementY;
  };
  private clear = (): void => {this.held.clear();this.mouseX=0;this.mouseY=0;this.pressed.clear();};
  sample(): SampledControls {
    const down=(action:Action)=>this.held.has(this.bindings[action]);
    const input={...ZERO_INPUT};
    input.forward=Number(down('forward'))-Number(down('backward'));
    input.strafe=Number(down('right'))-Number(down('left'));
    input.lift=Number(down('up'))-Number(down('down'));
    input.pitch=Number(down('pitchUp'))-Number(down('pitchDown'));
    input.yaw=Number(down('yawRight'))-Number(down('yawLeft'));
    input.roll=Number(down('rollRight'))-Number(down('rollLeft'));
    input.boost=down('boost');
    input.yaw=clamp(input.yaw+this.mouseX*0.017);
    input.pitch=clamp(input.pitch-this.mouseY*0.017);
    this.mouseX=0;this.mouseY=0;
    let pad: Gamepad | null = null;
    try { pad=navigator.getGamepads().find(p=>p?.connected) ?? null; } catch { /* API unavailable */ }
    const actions=Array.from(this.pressed);
    this.pressed.clear();
    if (pad) {
      const button=(index:number)=>pad!.buttons[index]?.pressed??false;
      input.strafe=clamp(input.strafe+axes(pad.axes[0]??0));
      input.forward=clamp(input.forward-axes(pad.axes[1]??0));
      input.yaw=clamp(input.yaw+axes(pad.axes[2]??0));
      input.pitch=clamp(input.pitch-axes(pad.axes[3]??0));
      input.lift=clamp(input.lift+Number(button(7))-Number(button(6)));
      input.roll=clamp(input.roll+Number(button(5))-Number(button(4)));
      input.boost ||= button(0);
      const mapping: Record<OneShot,number>={assist:3,travel:2,camera:9,target:1};
      for(const [action,index] of Object.entries(mapping) as [OneShot,number][]) {
        if(button(index)){
          if(!this.padPrevious.has(action))actions.push(action);
          this.padPrevious.add(action);
        }else this.padPrevious.delete(action);
      }
    } else this.padPrevious.clear();
    return {input,actions,gamepad:Boolean(pad)};
  }
  dispose():void {
    window.removeEventListener('keydown',this.keyDown);
    window.removeEventListener('keyup',this.keyUp);
    window.removeEventListener('blur',this.clear);
    document.removeEventListener('mousemove',this.mouseMove);
    this.canvas.removeEventListener('click',this.lockMouse);
  }
}
