import type { SpaceView } from '../render/scene';
import { SHIP_VISUALS, type ShipVisualId } from '../render/ship-library';

function getInitialShip(): ShipVisualId {
  const query=new URLSearchParams(window.location.search).get('ship');
  if(SHIP_VISUALS.some(v=>v.id===query))return query as ShipVisualId;
  try{
    const saved=window.localStorage.getItem('spacesim-visual-v1');
    if(SHIP_VISUALS.some(v=>v.id===saved))return saved as ShipVisualId;
  }catch{/* private browsing */}
  return 'insurgent';
}
export class ShipShowroom {
  private readonly buttons=new Map<ShipVisualId,HTMLButtonElement>();
  private readonly status:HTMLElement;
  private readonly activeName:HTMLElement;
  private readonly bloom:HTMLButtonElement;
  private request=0;
  constructor(host:HTMLElement,private readonly view:SpaceView){
    const panel=document.createElement('section');
    panel.className='showroom';
    panel.innerHTML=`<div class="showroom-overline">SPACE SIM // ART PASS 2.0</div>
      <div class="showroom-head"><b>HANGAR PORÓWNAWCZY</b><span>GLTF / PBR</span></div>
      <p>Przełącz kadłub bez zmiany fizyki lotu</p>
      <div id="ship-options" class="ship-options"></div>
      <div class="showroom-details"><span id="active-ship"></span><button type="button" id="bloom"></button></div>
      <div class="showroom-status" id="ship-status" aria-live="polite">Wczytywanie modeli…</div>
      <a href="https://quaternius.com/packs/ultimatespaceships.html" target="_blank" rel="noopener noreferrer">MODELE: QUATERNIUS / CC0 ↗</a>`;
    host.append(panel);
    this.status=panel.querySelector('#ship-status')!;
    this.activeName=panel.querySelector('#active-ship')!;
    this.bloom=panel.querySelector('#bloom')!;
    this.bloom.addEventListener('click',()=>{
      const enabled=this.view.toggleBloom();
      this.bloom.textContent='BLOOM '+(enabled?'ON':'OFF');
    });
    this.bloom.textContent='BLOOM '+(this.view.isBloomEnabled()?'ON':'OFF');
    const wrap=panel.querySelector('#ship-options')!;
    for(const entry of SHIP_VISUALS){
      const button=document.createElement('button');
      button.type='button';
      button.className='ship-option';
      const name=document.createElement('b');name.textContent=entry.label;
      const source=document.createElement('span');source.textContent=entry.source;
      button.append(name,source);
      button.title=entry.description;
      button.addEventListener('click',()=>{void this.select(entry.id);});
      wrap.append(button);
      this.buttons.set(entry.id,button);
    }
    void this.select(getInitialShip());
  }
  async select(id:ShipVisualId):Promise<void>{
    const sequence=++this.request;
    for(const [key,button] of this.buttons)button.classList.toggle('selected',key===id);
    this.status.textContent='Ładowanie '+id.toUpperCase()+'…';
    try{
      await this.view.setShipVisual(id);
      if(sequence!==this.request)return;
      const definition=SHIP_VISUALS.find(v=>v.id===id)!;
      this.activeName.textContent=definition.description;
      this.status.textContent=id==='prototype'?'MODEL AUTORSKI / PROCEDURALNY':'MODEL 3D WCZYTANY · '+definition.source;
      try{window.localStorage.setItem('spacesim-visual-v1',id);}catch{/* persistence optional */}
    }catch(error){
      if(sequence!==this.request)return;
      this.status.textContent='BŁĄD MODELU: '+String(error);
      for(const [key,button] of this.buttons)button.classList.toggle('selected',key===this.view.getSelectedHull());
      // Existing procedural model is always available after a download failure.
      await this.view.setShipVisual('prototype');
      this.activeName.textContent='Tryb awaryjny: model proceduralny';
    }
  }
}
