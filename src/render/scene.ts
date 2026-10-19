import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadShipVisual, SHIP_VISUALS, type ShipVisualId } from './ship-library';
import {createModularSpaceStation,applyStationPbr} from './station';
import {createVanguardPbrShip,applyVanguardPbr} from './vanguard';
import {loadPbrSets,releasePbrSets,type PbrTextureSet} from './pbr-materials';
import type { Catalog } from '../data/catalog';
import type { PilotState, WorldState } from '../sim/types';

export type CameraMode = 'cockpit' | 'chase';
export interface ScreenMarker {
  id: string; x: number; y: number; distance: number; visible: boolean;
}
const vector = (v: readonly number[]) => new THREE.Vector3(v[0]??0,v[1]??0,v[2]??0);
const quaternion = (v: readonly number[]) => new THREE.Quaternion(v[0]??0,v[1]??0,v[2]??0,v[3]??1);
function material(color: number, metalness=0.6, emissive=0):THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color,metalness,roughness:0.4,emissive,emissiveIntensity:emissive?1.5:0});
}
function box(parent:THREE.Object3D, size: [number,number,number], pos:[number,number,number], mat:THREE.Material): THREE.Mesh {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);
  mesh.position.set(...pos);parent.add(mesh);return mesh;
}
function radialGlowTexture():THREE.DataTexture {
  const n=64, pixels=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const dx=(x+0.5-n/2)/(n/2),dy=(y+0.5-n/2)/(n/2);
    const r2=dx*dx+dy*dy;
    const falloff=Math.pow(Math.max(0,1-r2),4);
    const index=(y*n+x)*4;
    pixels[index]=255; pixels[index+1]=255; pixels[index+2]=255;
    pixels[index+3]=Math.round(255*falloff);
  }
  const result=new THREE.DataTexture(pixels,n,n,THREE.RGBAFormat);
  result.needsUpdate=true;
  return result;
}
function buildShip(): THREE.Group {
  const ship=new THREE.Group();
  const hull=material(0x8499a7),navy=material(0x25394f),edge=material(0x4dbcb5,0.35,0x123d39);
  const engine=new THREE.MeshStandardMaterial({color:0x48bce2,emissive:0x1c76de,emissiveIntensity:3});
  const center=new THREE.Mesh(new THREE.ConeGeometry(2.1,13,5),hull);
  center.rotation.x=-Math.PI/2; center.position.z=-0.3;ship.add(center);
  box(ship,[3.5,1.6,7],[0,0,2],navy);
  box(ship,[13,0.35,3.4],[0,-0.2,2.4],hull);
  for(const side of [-1,1]){
    const wing=box(ship,[6.1,0.45,2.1],[side*4.65,-0.35,2.1],navy);
    wing.rotation.y=side*0.12;
    box(ship,[1,0.8,4.8],[side*6.6,0.1,3],hull);
    box(ship,[0.18,0.25,4],[side*6.6,0.62,3],edge);
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.3,2.4,12),navy);
    nozzle.rotation.x=Math.PI/2; nozzle.position.set(side*1.85,-0.25,5.4);ship.add(nozzle);
    const glow=new THREE.Mesh(new THREE.CircleGeometry(0.83,20),engine);
    glow.position.set(side*1.85,-0.25,6.72); glow.rotation.y=Math.PI;ship.add(glow);
  }
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(1.7,12,8),material(0x224e73,0.4));
  canopy.scale.set(0.9,0.6,1.8);canopy.position.set(0,0.85,-1.9);ship.add(canopy);
  ship.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;}});
  return ship;
}
function buildCockpit(): THREE.Group {
  const frame=new THREE.Group();
  const metal=material(0x334b5b),display=new THREE.MeshBasicMaterial({color:0x1ad8bc});
  box(frame,[2.7,0.2,0.3],[0,-0.66,-1.4],metal);
  box(frame,[0.09,0.95,0.15],[-1.38,-0.13,-1.55],metal);
  box(frame,[0.09,0.95,0.15],[1.38,-0.13,-1.55],metal);
  box(frame,[0.9,0.06,0.01],[0,-0.55,-1.23],display);
  box(frame,[0.35,0.025,0.01],[-0.78,-0.53,-1.23],display);
  box(frame,[0.35,0.025,0.01],[0.78,-0.53,-1.23],display);
  return frame;
}
function buildBeacon():THREE.Group {
  const g=new THREE.Group(),steel=material(0xb6a58a),light=new THREE.MeshBasicMaterial({color:0xffbd5e});
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(9,14,110,8),steel);
  g.add(spine);
  for(const height of [-35,35]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(32,3,8,28),steel);
    ring.rotation.x=Math.PI/2;ring.position.y=height;g.add(ring);
  }
  const ball=new THREE.Mesh(new THREE.SphereGeometry(12,12,8),light);ball.position.y=58;g.add(ball);
  return g;
}
function buildStars():THREE.Points {
  const positions=new Float32Array(2400*3);
  let seed=0x92ed;
  const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
  for(let i=0;i<2400;i++){
    const z=rand()*2-1,theta=rand()*Math.PI*2,r=20000+rand()*15000;
    const width=Math.sqrt(1-z*z);
    positions[i*3]=Math.cos(theta)*width*r;
    positions[i*3+1]=Math.sin(theta)*width*r;
    positions[i*3+2]=z*r;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  return new THREE.Points(geo,new THREE.PointsMaterial({color:0xe5f1ff,size:40,sizeAttenuation:true,transparent:true,opacity:0.83,depthWrite:false}));
}
export class SpaceView {
  private readonly scene=new THREE.Scene();
  private readonly camera=new THREE.PerspectiveCamera(73,1,0.08,90000);
  private readonly renderer:THREE.WebGLRenderer;
  private readonly environmentTarget:THREE.WebGLRenderTarget;
  private readonly ship=new THREE.Group();
  private readonly oldHull=buildShip();
  private readonly vanguardHull=createVanguardPbrShip();
  private readonly modularStation=createModularSpaceStation();
  private pbrSets: {blue:PbrTextureSet;worn:PbrTextureSet}|null=null;
  private readonly loadedHulls=new Map<ShipVisualId,THREE.Group>();
  private readonly loadingHulls=new Map<ShipVisualId,Promise<THREE.Group>>();
  private visual:ShipVisualId='prototype';
  private requestedVisual:ShipVisualId='prototype';
  private readonly engineGlow=new THREE.Group();
  private readonly composer:EffectComposer;
  private bloomEnabled=true;
  private readonly cockpit=buildCockpit();
  private readonly stars=buildStars();
  private readonly objects=new Map<string,THREE.Object3D>();
  private readonly currentPos=new THREE.Vector3();
  private readonly currentQuat=new THREE.Quaternion();
  private mode:CameraMode='chase';
  private width=1;private height=1;
  constructor(private readonly host:HTMLElement,private readonly catalog:Catalog){
    this.scene.background=new THREE.Color(0x030812);
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=0.98;
    const studio=new RoomEnvironment();
    const generator=new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget=generator.fromScene(studio,0.06);
    this.scene.environment=this.environmentTarget.texture;
    this.scene.environmentIntensity=0.40;
    studio.dispose();generator.dispose();
    host.append(this.renderer.domElement);
    this.scene.add(new THREE.AmbientLight(0x8fb0db,0.65));
    this.scene.add(new THREE.HemisphereLight(0x9fd5ff,0x20354f,0.92));
    const rim=new THREE.DirectionalLight(0x50baf5,1.15);
    rim.position.set(15,8,35);this.scene.add(rim);
    const bounce=new THREE.DirectionalLight(0xffbf8b,0.64);
    bounce.position.set(-30,-15,-12);this.scene.add(bounce);
    const sun=catalog.sector.sun;
    const sunLight=new THREE.DirectionalLight(0xffe4c6,1.8);
    sunLight.position.copy(vector(sun.position));this.scene.add(sunLight);
    const sunMesh=new THREE.Mesh(new THREE.SphereGeometry(sun.radius,20,14),
      new THREE.MeshBasicMaterial({color:sun.color}));
    sunMesh.position.copy(vector(sun.position));this.scene.add(sunMesh);
    for(const body of catalog.sector.bodies){
      let object:THREE.Object3D;
      if(body.kind==='station')object=this.modularStation;
      else if(body.kind==='beacon')object=buildBeacon();
      else {
        const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(body.radius*0.85,2),
          material(Number.parseInt(body.color.slice(1),16),0.1));
        mesh.rotation.set(0.3,0.6,0.1); object=mesh;
      }
      object.position.copy(vector(body.position));this.scene.add(object);this.objects.set(body.id,object);
    }
    this.scene.add(this.stars);this.scene.add(this.ship);
    this.ship.add(this.oldHull);
    this.ship.add(this.vanguardHull);
    this.vanguardHull.visible=false;
    void loadPbrSets().then(sets=>{
      this.pbrSets=sets;
      applyStationPbr(this.modularStation,sets.blue,sets.worn);
      applyVanguardPbr(this.vanguardHull,sets.blue,sets.worn);
    }).catch(error=>{
      console.warn('Local PBR textures unavailable; falling back to built-in materials',error);
    });
    const glowMaterial=new THREE.SpriteMaterial({
      map:radialGlowTexture(),color:0x55cffa,transparent:true,opacity:0.33,
      depthWrite:false,blending:THREE.AdditiveBlending
    });
    const exhaust=new THREE.Sprite(glowMaterial);
    exhaust.position.set(0,-0.2,8);exhaust.scale.set(6.5,6.5,1);
    this.engineGlow.add(exhaust);
    const engineLight=new THREE.PointLight(0x269efb,3,18);
    engineLight.position.set(0,-0.2,7);this.engineGlow.add(engineLight);
    this.ship.add(this.engineGlow);
    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(800,600),0.22,0.24,1.18));
    this.composer.addPass(new OutputPass());
    this.camera.add(this.cockpit);this.scene.add(this.camera);
    this.setCameraMode('chase');
    this.resize(host.clientWidth,host.clientHeight);
  }
  getSelectedHull():ShipVisualId{return this.visual;}
  isBloomEnabled():boolean{return this.bloomEnabled;}
  toggleBloom():boolean{this.bloomEnabled=!this.bloomEnabled;return this.bloomEnabled;}
  async setShipVisual(id:ShipVisualId):Promise<void>{
    this.requestedVisual=id;
    const candidate=SHIP_VISUALS.find(model=>model.id===id);
    if(!candidate)throw new Error('Unknown ship visual: '+id);
    if(id==='prototype'){
      this.visual=id;
      this.oldHull.visible=true;
      this.vanguardHull.visible=false;
      for(const hull of this.loadedHulls.values())hull.visible=false;
      return;
    }
    if(id==='vanguard'){
      this.visual=id;
      this.oldHull.visible=false;
      this.vanguardHull.visible=true;
      for(const hull of this.loadedHulls.values())hull.visible=false;
      return;
    }
    let object=this.loadedHulls.get(id);
    if(!object){
      let pending=this.loadingHulls.get(id);
      if(!pending){
        pending=loadShipVisual(candidate);
        this.loadingHulls.set(id,pending);
      }
      try{object=await pending;}finally{this.loadingHulls.delete(id);}
      if(!this.loadedHulls.has(id)){
        this.ship.add(object);
        this.loadedHulls.set(id,object);
      }
    }
    if(this.requestedVisual!==id)return;
    this.visual=id;
    this.oldHull.visible=false;
    this.vanguardHull.visible=false;
    for(const [other,hull] of this.loadedHulls)hull.visible=other===id;
  }
  getCanvas():HTMLCanvasElement{return this.renderer.domElement;}
  setCameraMode(mode:CameraMode):void {
    this.mode=mode;
    this.ship.visible=mode==='chase';
    this.cockpit.visible=mode==='cockpit';
  }
  toggleCamera():CameraMode {this.setCameraMode(this.mode==='chase'?'cockpit':'chase');return this.mode;}
  getCameraMode():CameraMode {return this.mode;}
  resize(width:number,height:number):void {
    this.width=Math.max(1,width);this.height=Math.max(1,height);
    this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width,this.height,false);
    this.composer.setSize(this.width,this.height);
  }
  draw(previous:WorldState,current:WorldState,alpha:number):ScreenMarker[]{
    const pilot=current.pilot;
    if(!pilot)return [];
    const last: PilotState=previous.pilot??pilot;
    const fraction=Math.max(0,Math.min(1,alpha));
    this.currentPos.copy(vector(last.position)).lerp(vector(pilot.position),fraction);
    this.currentQuat.copy(quaternion(last.orientation)).slerp(quaternion(pilot.orientation),fraction);
    this.ship.position.copy(this.currentPos);this.ship.quaternion.copy(this.currentQuat);
    const camOffset=this.mode==='chase'?new THREE.Vector3(0,5.4,23):new THREE.Vector3(0,0.95,-1.3);
    this.camera.position.copy(this.currentPos).add(camOffset.applyQuaternion(this.currentQuat));
    this.camera.quaternion.copy(this.currentQuat);
    this.camera.updateMatrixWorld(true);
    this.stars.position.copy(this.currentPos);
    const markers:ScreenMarker[]=this.catalog.sector.bodies.map(body=>{
      const clip=vector(body.position).project(this.camera);
      return {
        id:body.id,x:(clip.x*0.5+0.5)*this.width,y:(-clip.y*0.5+0.5)*this.height,
        distance:vector(body.position).distanceTo(this.currentPos),
        visible:clip.z>=-1&&clip.z<=1&&Math.abs(clip.x)<=0.96&&Math.abs(clip.y)<=0.93
      };
    });
    if(this.bloomEnabled)this.composer.render();
    else this.renderer.render(this.scene,this.camera);
    return markers;
  }
  dispose():void {
    this.scene.traverse(child=>{
      if(child instanceof THREE.Mesh||child instanceof THREE.Points){
        child.geometry.dispose();
        const mats=Array.isArray(child.material)?child.material:[child.material];
        for(const mat of mats) mat.dispose();
      }
    });
    this.composer.dispose();
    this.environmentTarget.dispose();
    if(this.pbrSets)releasePbrSets(this.pbrSets);
    this.renderer.dispose();this.renderer.domElement.remove();
  }
}
