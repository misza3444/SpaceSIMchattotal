import { translate, type Language, type TranslationKey } from '../i18n';
import type { Catalog } from '../data/catalog';
import type { WorldState } from '../sim/types';
import { conjugate, rotate, speed, travelProgress, weaponsAvailable } from '../sim/flight';
import type { ScreenMarker, CameraMode } from '../render/scene';
import type { Action, FlightControls } from '../input/controls';

export interface UIActions {
  save:()=>void; load:()=>void; fresh:()=>void;
  assist:()=>void; travel:()=>void; target:()=>void; camera:()=>void; language:()=>void;
}
const names: Record<Action,{pl:string,en:string}> = {
  forward:{pl:'Naprzód',en:'Forward'},backward:{pl:'Wstecz',en:'Reverse'},
  left:{pl:'W lewo',en:'Strafe left'},right:{pl:'W prawo',en:'Strafe right'},
  up:{pl:'W górę',en:'Up'},down:{pl:'W dół',en:'Down'},
  pitchUp:{pl:'Nos w górę',en:'Pitch up'},pitchDown:{pl:'Nos w dół',en:'Pitch down'},
  yawLeft:{pl:'Skręt w lewo',en:'Yaw left'},yawRight:{pl:'Skręt w prawo',en:'Yaw right'},
  rollLeft:{pl:'Przechył w lewo',en:'Roll left'},rollRight:{pl:'Przechył w prawo',en:'Roll right'},
  boost:{pl:'Dopalacz',en:'Boost'},assist:{pl:'Asysta lotu',en:'Flight assist'},
  travel:{pl:'Podróż',en:'Travel mode'},camera:{pl:'Kamera',en:'Camera'},target:{pl:'Następny cel',en:'Next target'}
};
const buttons = ['assist','travel','target','camera','save','load','new','language'] as const;
type ButtonKey = typeof buttons[number];
export class Dashboard {
  private lang:Language='pl';
  private status:HTMLElement;
  private readonly readouts:Record<string,HTMLElement>={};
  private readonly buttons={} as Record<ButtonKey,HTMLButtonElement>;
  private readonly markers=new Map<string,HTMLElement>();
  private readonly radar:HTMLCanvasElement;
  private readonly radarContext:CanvasRenderingContext2D;
  private readonly bindings:HTMLElement;
  private readonly title:HTMLElement;
  private readonly sub:HTMLElement;
  private readonly stage:HTMLElement;
  private readonly hint:HTMLElement;
  private readonly charge:HTMLElement;
  private readonly viewport:HTMLElement;
  private readonly bindPanel:HTMLElement;
  constructor(host:HTMLElement,private readonly catalog:Catalog,private readonly controls:FlightControls,actions:UIActions) {
    host.innerHTML=`<div class="flight-ui">
      <div class="topline"><span class="badge" id="stage"></span><span class="sector" id="sector"></span><span class="fps" id="fps"></span></div>
      <section class="console"><div class="eyebrow">SPACE SIM // FLIGHT COMPUTER <i>● LIVE</i></div>
        <h1 id="title"></h1><p id="sub"></p>
        <div class="velocity"><span id="speed-label"></span><strong id="speed">000</strong><small>m/s</small></div>
        <div class="mini-grid"><div><small id="assist-label"></small><b id="assist-value"></b></div><div><small id="travel-label"></small><b id="travel-value"></b></div><div><small id="target-label"></small><b id="target-value"></b></div><div><small id="camera-label"></small><b id="camera-value"></b></div></div>
        <div class="travel-track"><div id="charge"></div></div>
        <div class="console-actions" id="actions"></div>
        <button type="button" class="bindings-toggle" id="remap-toggle"></button>
        <div class="bindings" id="bindings" hidden></div>
        <p class="status" id="status" aria-live="polite"></p>
      </section>
      <div class="reticle" aria-hidden="true"><span></span><span></span><i></i></div>
      <div class="target-markers" id="markers"></div>
      <div class="horizon-bars"><span>−90</span><i></i><span>+90</span></div>
      <section class="radar-panel"><div class="radar-heading">SPATIAL RADAR <span>3D</span></div><canvas id="radar" width="210" height="170"></canvas><div id="weapons"></div></section>
      <div class="control-hint" id="hint"></div>
    </div>`;
    this.viewport=host.querySelector('.flight-ui')!;
    this.status=host.querySelector('#status')!;
    this.title=host.querySelector('#title')!;
    this.sub=host.querySelector('#sub')!;
    this.stage=host.querySelector('#stage')!;
    this.hint=host.querySelector('#hint')!;
    this.charge=host.querySelector('#charge')!;
    this.bindings=host.querySelector('#bindings')!;
    this.bindPanel=host.querySelector('#remap-toggle')!;
    this.radar=host.querySelector('#radar')!;
    const ctx=this.radar.getContext('2d');
    if(!ctx)throw new Error('2D radar unavailable');
    this.radarContext=ctx;
    for (const name of ['sector','fps','speed-label','speed','assist-label','assist-value','travel-label','travel-value','target-label','target-value','camera-label','camera-value','weapons'])this.readouts[name]=host.querySelector('#'+name)!;
    const handlers:Record<ButtonKey,()=>void> = {...actions,new:actions.fresh};
    const actionsElement=host.querySelector('#actions')!;
    for (const key of buttons) {
      const button=document.createElement('button');
      button.type='button';
      button.addEventListener('click',handlers[key]);
      actionsElement.append(button); this.buttons[key]=button;
    }
    this.bindPanel.addEventListener('click',()=>{
      this.bindings.hidden=!this.bindings.hidden;
      if(!this.bindings.hidden)this.renderBindings();
    });
    const container=host.querySelector('#markers')!;
    for (const body of catalog.sector.bodies) {
      const el=document.createElement('div');
      el.className='marker';
      el.innerHTML='<span class="marker-glyph">◇</span><span class="marker-text"></span>';
      container.append(el);this.markers.set(body.id,el);
    }
    this.setLanguage('pl');
  }
  setLanguage(lang:Language):void {
    this.lang=lang;
    const t=(key:TranslationKey)=>translate(lang,key);
    this.title.textContent=t('title');
    this.sub.textContent=t('subtitle');
    this.stage.textContent=t('stage');
    this.hint.textContent=t('flightHint');
    this.readouts['sector']!.textContent=this.catalog.sector.name[lang];
    for(const key of buttons)this.buttons[key].textContent=t(key==='new'?'new':key);
    for(const key of ['speed','assist','travel','target','camera'] as const)this.readouts[key+'-label']!.textContent=t(key==='speed'?'speedLabel':key);
    this.bindPanel.textContent=t('remap');
    this.renderBindings();
    this.message('ready');
  }
  getLanguage():Language{return this.lang;}
  message(key:TranslationKey):void {this.status.textContent=translate(this.lang,key);}
  error(error:unknown):void {this.status.textContent=translate(this.lang,'error')+': '+String(error);}
  private renderBindings():void {
    this.bindings.replaceChildren();
    const label=document.createElement('p');label.textContent=translate(this.lang,'remapHelp');this.bindings.append(label);
    for(const [key,definition] of Object.entries(names) as [Action,{pl:string,en:string}][]) {
      const row=document.createElement('div');row.className='binding-row';
      const name=document.createElement('span');name.textContent=definition[this.lang];
      const button=document.createElement('button');
      button.textContent=this.controls.getBindings()[key];
      button.addEventListener('click',()=>{
        button.textContent='…';
        this.controls.beginRemap(key,()=>{this.renderBindings();});
      });
      row.append(name,button);this.bindings.append(row);
    }
  }
  paintMarkers(markers:ScreenMarker[],state:WorldState):void {
    for (const marker of markers) {
      const el=this.markers.get(marker.id);
      if(!el)continue;
      el.hidden=!marker.visible;
      if(!marker.visible)continue;
      el.style.transform=`translate3d(${marker.x.toFixed(1)}px,${marker.y.toFixed(1)}px,0)`;
      el.classList.toggle('selected',state.pilot?.selectedTarget===marker.id);
      const body=this.catalog.sector.bodies.find(b=>b.id===marker.id)!;
      const text=el.querySelector('.marker-text')!;
      text.textContent=`${body.name[this.lang]} · ${(marker.distance/1000).toFixed(1)} km`;
    }
  }
  update(state:WorldState,fps:number,camera:CameraMode,gamepad:boolean):void {
    const pilot=state.pilot;
    if(!pilot)return;
    const ship=this.catalog.ships.find(s=>s.id===pilot.shipId)!;
    const t=(key:TranslationKey)=>translate(this.lang,key);
    this.readouts['fps']!.textContent=`${Math.round(fps)} FPS • T${state.tick}`;
    this.readouts['speed']!.textContent=speed(pilot.velocity).toFixed(0).padStart(3,'0');
    this.readouts['assist-value']!.textContent=pilot.assist?t('on'):t('off');
    this.readouts['travel-value']!.textContent=t(pilot.mode);
    this.readouts['camera-value']!.textContent=t(camera);
    const body=this.catalog.sector.bodies.find(b=>b.id===pilot.selectedTarget);
    this.readouts['target-value']!.textContent=body?body.name[this.lang]:t('none');
    this.readouts['weapons']!.textContent=weaponsAvailable(pilot)?t('weaponsOnline'):t('weaponsOffline');
    this.charge.style.width=`${Math.round(travelProgress(pilot,ship)*100)}%`;
    this.buttons.assist.classList.toggle('active',pilot.assist);
    this.buttons.travel.classList.toggle('active',pilot.mode==='charging'||pilot.mode==='travel');
    this.hint.textContent=gamepad?t('gamepadHint'):t('flightHint');
    this.drawRadar(pilot);
  }
  private drawRadar(pilot:NonNullable<WorldState['pilot']>):void {
    const c=this.radarContext,w=this.radar.width,h=this.radar.height;
    c.clearRect(0,0,w,h);
    const centerX=w/2,centerY=h*0.51,radius=70;
    c.strokeStyle='rgba(75,220,205,.4)';c.lineWidth=1;
    for(const size of [1,0.66,0.33]){
      c.beginPath();c.ellipse(centerX,centerY,radius*size,radius*0.58*size,0,0,2*Math.PI);c.stroke();
    }
    c.beginPath();c.moveTo(centerX,centerY-radius*.58);c.lineTo(centerX,centerY+radius*.58);c.moveTo(centerX-radius,centerY);c.lineTo(centerX+radius,centerY);c.stroke();
    c.fillStyle='#e5fff9';c.beginPath();c.moveTo(centerX,centerY-8);c.lineTo(centerX-5,centerY+5);c.lineTo(centerX+5,centerY+5);c.fill();
    for (const body of this.catalog.sector.bodies) {
      const local=rotate(conjugate(pilot.orientation),[
        body.position[0]-pilot.position[0],body.position[1]-pilot.position[1],body.position[2]-pilot.position[2]
      ]);
      const radarRange=6000, x=centerX+Math.max(-1,Math.min(1,local[0]/radarRange))*radius;
      const flatY=centerY+Math.max(-1,Math.min(1,local[2]/radarRange))*radius*0.58;
      const vertical=Math.max(-40,Math.min(40,local[1]/radarRange*35));
      const y=flatY-vertical;
      const selected=body.id===pilot.selectedTarget;
      c.strokeStyle=selected?'#ffcc68':'#3ad8c8';
      c.beginPath();c.moveTo(x,flatY);c.lineTo(x,y);c.stroke();
      c.fillStyle=selected?'#ffcc68':'#3ad8c8';
      c.beginPath();c.arc(x,y,selected?4.5:2.7,0,2*Math.PI);c.fill();
    }
    c.font='10px monospace';c.fillStyle='#92b7c7';c.fillText('6 KM',7,h-8);
  }
}
