import './style.css';
import './style-showroom.css';
import { ShipShowroom } from './ui/showroom';
import { Simulation, FIXED_DT } from './sim/simulation';
import { FixedStepClock } from './sim/clock';
import { SpaceView } from './render/scene';
import { Dashboard } from './ui/dashboard';
import { FlightControls } from './input/controls';
import { loadCatalog } from './data/catalog';
import { loadWorld, saveWorld } from './storage/saves';

const catalog=loadCatalog();
const root=document.querySelector<HTMLDivElement>('#app');
if(!root)throw new Error('App root missing');
root.innerHTML='<div id="viewport"></div><div id="panel"></div>';
const viewport=root.querySelector<HTMLDivElement>('#viewport')!;
const view=new SpaceView(viewport,catalog);
const controls=new FlightControls(view.getCanvas());
let sim=new Simulation(42,undefined,catalog);
let current=sim.snapshot(),previous=current;
const clock=new FixedStepClock(FIXED_DT);
const resetFrame=()=>{
  current=sim.snapshot();previous=current;clock.reset();
};
const hud=new Dashboard(root.querySelector<HTMLDivElement>('#panel')!,catalog,controls,{
  save:()=>{void saveWorld(sim.snapshot()).then(()=>hud.message('saved')).catch(e=>hud.error(e));},
  load:()=>{void loadWorld().then(state=>{
    if(!state){hud.error('Empty save slot');return;}
    sim=new Simulation(state.seed,state,catalog);resetFrame();hud.message('loaded');
  }).catch(e=>hud.error(e));},
  fresh:()=>{sim=new Simulation(42,undefined,catalog);resetFrame();hud.message('newWorld');},
  assist:()=>sim.commands.enqueue({type:'toggleAssist'}),
  travel:()=>sim.commands.enqueue({type:'toggleTravel'}),
  target:()=>sim.commands.enqueue({type:'nextTarget'}),
  camera:()=>{view.toggleCamera();},
  language:()=>hud.setLanguage(hud.getLanguage()==='pl'?'en':'pl')
});
new ShipShowroom(root.querySelector<HTMLDivElement>('#panel')!,view);
window.addEventListener('resize',()=>view.resize(viewport.clientWidth,viewport.clientHeight));
let frameCount=0,fps=0,measureStart=0,lastHud=0,gamepad=false;
function frame(timestampMs:number):void {
  const now=timestampMs/1000;
  const alpha=clock.advance(now,()=>{
    const sample=controls.sample();
    gamepad=sample.gamepad;
    for(const action of sample.actions){
      if(action==='camera')view.toggleCamera();
      else if(action==='assist')sim.commands.enqueue({type:'toggleAssist'});
      else if(action==='travel')sim.commands.enqueue({type:'toggleTravel'});
      else if(action==='target')sim.commands.enqueue({type:'nextTarget'});
    }
    sim.commands.enqueue({type:'flightInput',input:sample.input});
    previous=current;sim.step();current=sim.snapshot();
  });
  const markers=view.draw(previous,current,alpha);
  hud.paintMarkers(markers,current);
  frameCount++;
  if(now-measureStart>=1){
    fps=frameCount/Math.max(.01,now-measureStart);frameCount=0;measureStart=now;
  }
  if(now-lastHud>=.12){
    hud.update(current,fps,view.getCameraMode(),gamepad);lastHud=now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
