import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import { createPbrMaterial, type PbrTextureSet } from './pbr-materials';

type Finish = 'blue' | 'worn';
const paint = new THREE.MeshStandardMaterial({color:0x35566c,metalness:.65,roughness:.4});
const steel = new THREE.MeshStandardMaterial({color:0x647c88,metalness:.78,roughness:.37});
const graphite = new THREE.MeshStandardMaterial({color:0x101e2b,metalness:.72,roughness:.58});
const gold = new THREE.MeshStandardMaterial({color:0xc58a4a,metalness:.65,roughness:.42});
const glow = new THREE.MeshBasicMaterial({color:0x47e2cf});
const windows = new THREE.MeshBasicMaterial({color:0x94d9ff});
const PANEL_SIZE = 6;

function detailBox(parent: THREE.Group, size: [number,number,number],
  at:[number,number,number], mat:THREE.Material, finish?:Finish): THREE.Mesh {
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);
  m.position.set(...at);
  if(finish)m.userData.finish=finish;
  parent.add(m);
  return m;
}
function lathe(parent:THREE.Group,radius:number,length:number,at:[number,number,number],
  mat:THREE.Material,radial=12,orientation:'z'|'x'|'y'='z'):THREE.Mesh {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,radial),mat);
  mesh.rotation.x=orientation==='z'?Math.PI/2:0;
  if(orientation==='x')mesh.rotation.z=Math.PI/2;
  mesh.position.set(...at);parent.add(mesh);return mesh;
}
function torus(parent:THREE.Group,radius:number,tube:number,z:number,mat:THREE.Material,seg=40):THREE.Mesh {
  const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,7,seg),mat);
  mesh.position.z=z;parent.add(mesh);return mesh;
}
function setInstancedBox(parent:THREE.Group, specs:{pos:THREE.Vector3; scale:THREE.Vector3; rot?:number}[],mat:THREE.Material):void {
  if(!specs.length)return;
  const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,specs.length);
  const pivot=new THREE.Object3D();
  for(let i=0;i<specs.length;i++){
    const spec=specs[i]!;
    pivot.position.copy(spec.pos);
    pivot.scale.copy(spec.scale);
    pivot.rotation.set(0,0,spec.rot??0);
    pivot.updateMatrix();m.setMatrixAt(i,pivot.matrix);
  }
  m.instanceMatrix.needsUpdate=true;
  m.computeBoundingSphere();
  parent.add(m);
}

/**
 * Batches static meshes per material and finish. Dock components remain distinct
 * authoring modules, but render as a handful of GPU draws after construction.
 * Navigation beacons already use InstancedMesh and stay instanced.
 */
function batchStaticMeshes(root: THREE.Group): void {
  root.updateMatrixWorld(true);
  const sources: THREE.Mesh[]=[];
  root.traverse(child=>{
    if(child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh))
      sources.push(child);
  });
  const groups=new Map<string,{mat:THREE.Material;finish?:Finish; meshes:THREE.Mesh[]}>();
  for(const mesh of sources){
    const mat=mesh.material;
    if(Array.isArray(mat))continue;
    const finish=mesh.userData.finish as Finish|undefined;
    const key=mat.uuid+':'+(finish??'bare');
    let target=groups.get(key);
    if(!target){target={mat,meshes:[]};if(finish)target.finish=finish;groups.set(key,target);}
    target.meshes.push(mesh);
  }
  root.userData.sourceMeshes=sources.length;
  for(const bucket of groups.values()){
    if(bucket.meshes.length<=1)continue;
    const baked=bucket.meshes.map(mesh=>{
      const geometry=mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      return geometry;
    });
    const merged=mergeGeometries(baked,false);
    for(const clone of baked)clone.dispose();
    if(!merged)continue; // Unsupported attribute layout: preserve original meshes.
    for(const original of bucket.meshes){
      original.parent?.remove(original);
      original.geometry.dispose();
    }
    const combined=new THREE.Mesh(merged,bucket.mat);
    combined.name='GPU-batched static station surfaces';
    if(bucket.finish)combined.userData.finish=bucket.finish;
    root.add(combined);
  }
  let drawCalls=0;
  root.traverse(child=>{if(child instanceof THREE.Mesh)drawCalls++;});
  root.userData.drawCalls=drawCalls;
}

export function createModularSpaceStation():THREE.Group {
  const root=new THREE.Group();
  root.name='Asterion Orbital Shipyard — modular production station';
  // A 720-m industrial facility: a pressure hull, docking torus,
  // five longitudinal yards, external fuel silos and asymmetric arrays.
  lathe(root,47,440,[0,0,0],graphite,16);
  lathe(root,53,310,[0,0,15],paint,16);
  for(const z of [-206,-148,-86,-25,35,95,155,210]){
    lathe(root,58,8,[0,0,z],steel,16);
    torus(root,62,3.7,z,gold,32);
  }
  // Docking torus (XY plane, line of sight along Z).
  torus(root,245,23,-30,graphite,64);
  torus(root,244,28,-30,paint,64);
  torus(root,244,7,-55,steel,64);
  torus(root,244,7,-5,steel,64);
  torus(root,244,4,-30,gold,64);
  const outerR=280;
  for(let n=0;n<12;n++){
    const angle=n*Math.PI/6, x=Math.cos(angle),y=Math.sin(angle);
    const bay=new THREE.Group();
    bay.position.set(x*outerR,y*outerR,-30);
    bay.rotation.z=angle-Math.PI/2;
    detailBox(bay,[80,51,104],[0,0,0],graphite);
    detailBox(bay,[71,47,98],[0,-2,0],paint,'blue');
    detailBox(bay,[57,7,69],[0,-29,14],gold);
    detailBox(bay,[54,5,43],[0,-26,19],graphite);
    for(let j=-1;j<=1;j+=2){
      detailBox(bay,[6,8,103],[j*38,23,0],steel);
      detailBox(bay,[7,51,10],[j*35,-2,-46],gold);
      detailBox(bay,[11,10,10],[j*29,-30,-32],glow);
      detailBox(bay,[25,3,13],[j*25,29,15],windows);
    }
    // Tall service crane and hanging loading lights.
    detailBox(bay,[5,15,120],[0,40,0],steel);
    detailBox(bay,[55,5,10],[0,48,-42],gold);
    detailBox(bay,[14,2,9],[0,-31,-45],windows);
    root.add(bay);
    // Triangulated spoke is a reusable truss module.
    const spoke=new THREE.Group();
    spoke.rotation.z=angle;
    detailBox(spoke,[195,11,12],[151,0,-42],steel);
    detailBox(spoke,[195,7,7],[151,0,-20],steel);
    for(let k=0;k<6;k++){
      const support=detailBox(spoke,[6,8,33],[65+k*33,0,-31],gold);
      support.rotation.y=k%2?.54:-.54;
    }
    root.add(spoke);
  }
  // Longitudinal shipyard gantries: visible heavy construction berths.
  for(const x of [-165,165]){
    const yard=new THREE.Group();
    yard.position.set(x,0,0);
    detailBox(yard,[24,36,450],[0,0,0],graphite);
    detailBox(yard,[18,29,442],[0,0,0],paint,'worn');
    for(const z of [-210,-175,-140,-105,-70,-35,0,35,70,105,140,175,210]){
      detailBox(yard,[52,48,8],[0,0,z],steel);
      detailBox(yard,[36,3,2],[0,28,z],gold);
    }
    for(const side of [-1,1]){
      detailBox(yard,[10,6,410],[side*34,-26,0],steel);
      for(const z of [-185,-115,-45,25,95,165]){
        detailBox(yard,[16,12,24],[side*32,-21,z],windows);
      }
    }
    root.add(yard);
  }
  // Habitat/processing barrels above and below the ring.
  for(const y of [-130,130]){
    for(const z of [-120,105]){
      const module=new THREE.Group();
      module.position.set(0,y,z);
      lathe(module,42,106,[0,0,0],paint,12);
      lathe(module,45,9,[0,0,-46],gold,12);
      lathe(module,45,9,[0,0,46],gold,12);
      detailBox(module,[93,7,57],[0,43,0],steel,'blue');
      for(let k=0;k<9;k++){
        const a=k*Math.PI*2/9;
        const light=detailBox(module,[13,3,20],[Math.cos(a)*45,Math.sin(a)*45,-3],windows);
        light.rotation.z=a;
      }
      root.add(module);
    }
  }
  // Radar antenna: non-axisymmetric silhouette, disambiguates station orientation.
  const dish=new THREE.Mesh(new THREE.SphereGeometry(39,18,10,0,Math.PI*2,0,Math.PI*.50),steel);
  dish.scale.set(1,1,.32);dish.rotation.x=-Math.PI/5;
  dish.position.set(-300,118,-58);root.add(dish);
  lathe(root,4,85,[-300,118,0],gold,8);
  const antenna=new THREE.Group(); antenna.position.set(-296,118,-58);
  detailBox(antenna,[4,4,100],[0,0,0],steel);
  for(let z=-45;z<=45;z+=18)detailBox(antenna,[37,2,2],[0,0,z],steel);
  root.add(antenna);
  // Two solar wings / radiators and central service cables.
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*430,0,120);
    detailBox(wing,[235,18,7],[0,0,0],steel);
    for(const dz of [-38,38]){
      const array=detailBox(wing,[224,80,5],[0,0,dz],graphite,'blue');
      array.rotation.y=side*.07;
      for(let x=-100;x<100;x+=26)detailBox(wing,[3,83,7],[x,0,dz],gold);
      for(let y=-29;y<35;y+=22)detailBox(wing,[227,2,7],[0,y,dz],steel);
    }
    root.add(wing);
    detailBox(root,[160,12,12],[side*355,0,120],steel);
    lathe(root,29,180,[side*390,0,-157],steel,12);
    lathe(root,23,176,[side*390,0,-157],paint,12);
  }
  // Repeated safety lights and panel lines: batched as instanced meshes.
  const indicators:{pos:THREE.Vector3;scale:THREE.Vector3;rot?:number}[]=[];
  const panels:{pos:THREE.Vector3;scale:THREE.Vector3;rot?:number}[]=[];
  for(let n=0;n<64;n++){
    const a=n*Math.PI*2/64;
    indicators.push({pos:new THREE.Vector3(Math.cos(a)*244,Math.sin(a)*244,-63),
      scale:new THREE.Vector3(6,6,4),rot:a});
    panels.push({pos:new THREE.Vector3(Math.cos(a)*244,Math.sin(a)*244,8),
      scale:new THREE.Vector3(8,5,3),rot:a});
  }
  setInstancedBox(root,indicators,glow);
  setInstancedBox(root,panels,steel);
  // PBR material upgrades are applied when locally vendored 1K maps are ready.
  root.userData.moduleCount=12;
  root.userData.stationType='modular-shipyard';
  root.userData.collisionRadius=520;
  root.userData.panelSize=PANEL_SIZE;
  batchStaticMeshes(root);
  return root;
}

export function applyStationPbr(root:THREE.Group,blue:PbrTextureSet,worn:PbrTextureSet):void {
  const mBlue=createPbrMaterial(blue,0xb0c4d4);
  const mWorn=createPbrMaterial(worn,0x9fb2b7);
  root.traverse(child=>{
    if(!(child instanceof THREE.Mesh))return;
    if(child.userData.finish==='blue')child.material=mBlue;
    if(child.userData.finish==='worn')child.material=mWorn;
  });
}
