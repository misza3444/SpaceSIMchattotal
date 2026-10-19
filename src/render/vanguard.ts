import * as THREE from 'three';
import {createPbrMaterial,type PbrTextureSet} from './pbr-materials';

type Finish='blue'|'worn';
const armor=new THREE.MeshStandardMaterial({color:0x566e81,metalness:.67,roughness:.49,flatShading:false});
const edge=new THREE.MeshStandardMaterial({color:0x172d3e,metalness:.64,roughness:.48});
const steel=new THREE.MeshStandardMaterial({color:0x9aafb9,metalness:.76,roughness:.35});
const copper=new THREE.MeshStandardMaterial({color:0xc78e51,metalness:.76,roughness:.35});
const blueGlow=new THREE.MeshBasicMaterial({color:0x5ccefa});
const redGlow=new THREE.MeshBasicMaterial({color:0xff8c67});
const glass=new THREE.MeshPhysicalMaterial({
  color:0x0c416d,metalness:.35,roughness:.12,clearcoat:1,clearcoatRoughness:.08
});

function block(parent:THREE.Group,dims:[number,number,number],pos:[number,number,number],
  material:THREE.Material,finish?:Finish):THREE.Mesh{
  const m=new THREE.Mesh(new THREE.BoxGeometry(...dims),material);
  m.position.set(...pos);if(finish)m.userData.finish=finish;
  parent.add(m);return m;
}
function cylinder(parent:THREE.Group,r:number,height:number,pos:[number,number,number],
  mat:THREE.Material,segments=12):THREE.Mesh{
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,height,segments),mat);
  m.rotation.x=Math.PI/2;m.position.set(...pos);parent.add(m);return m;
}
function wingGeometry(side:number):THREE.BufferGeometry{
  // A closed six-sided swept wing with proper UV mapping and vertex normals.
  const outline:[number,number][]=[
    [side*1.8,-5.8],[side*3.1,-6.2],[side*10.8,1.8],
    [side*10.6,6.4],[side*4.4,4.8],[side*1.9,6.0]
  ];
  const n=outline.length, vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(const y of [-.35,.35])for(const [x,z] of outline){
    vertices.push(x,y,z);
    uv.push((x/side+1)/12,(z+7)/15);
  }
  for(let i=1;i<n-1;i++){
    indices.push(0,i,i+1);
    indices.push(n,n+i+1,n+i);
  }
  for(let i=0;i<n;i++){
    const next=(i+1)%n;
    indices.push(i,next,n+next,i,n+next,n+i);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function smallSlots(parent:THREE.Group,x:number,z:number,mat:THREE.Material):void {
  for(let index=0;index<3;index++)block(parent,[.15,.06,.5],[x,.6,z+index*.8],mat);
}
export function createVanguardPbrShip():THREE.Group {
  const ship=new THREE.Group();
  ship.name='Vanguard — custom high-detail hard-surface PBR ship';
  // Geometry extends approx z -15 to +12: forward axis -Z.
  cylinder(ship,2.4,14,[0,0,-1],armor,12);
  block(ship,[4.6,2.8,13],[0,0,0],armor,'blue');
  const prow=new THREE.Mesh(new THREE.ConeGeometry(2.45,11,6),steel);
  prow.rotation.x=-Math.PI/2;prow.position.z=-10.5;ship.add(prow);
  const spine=block(ship,[1.65,1.4,17],[0,2.0,-.7],edge);
  spine.rotation.x=.06;
  block(ship,[3.9,.25,14],[0,1.7,0],steel,'worn');
  // Armored swept wings with separate reinforcing ribs.
  for(const side of [-1,1]){
    const wing=new THREE.Mesh(wingGeometry(side),armor);
    wing.material=armor.clone();
    wing.userData.finish='blue';
    ship.add(wing);
    const stripe=block(ship,[5.8,.16,.7],[side*7.2,.44,3.7],copper);
    stripe.rotation.y=side*.16;
    for(const z of [-3,0,3,5]){
      const rib=block(ship,[.18,.55,1.9],[side*5.5,.6,z],steel);
      rib.rotation.y=-side*.20;
    }
    // Two oversized nacelles visibly separate from the hull.
    cylinder(ship,1.55,10,[side*5.7,-.32,4.7],edge,16);
    cylinder(ship,1.36,8.9,[side*5.7,-.32,4.2],armor,16);
    for(const z of [1.3,4.1,6.9,8.9])
      cylinder(ship,1.61,.25,[side*5.7,-.32,z],steel,16);
    cylinder(ship,1.11,.15,[side*5.7,-.32,9.6],blueGlow,20);
    const exhaustRing=new THREE.Mesh(new THREE.TorusGeometry(1.45,.18,8,20),copper);
    exhaustRing.position.set(side*5.7,-.32,9.6);ship.add(exhaustRing);
    // Deployable-looking radiators and hardpoints on the wing tips.
    block(ship,[1.05,.5,4.2],[side*10.1,.1,4.2],edge);
    block(ship,[.7,.75,2.5],[side*10.1,.45,2.8],steel);
    block(ship,[1.4,.18,.4],[side*10.1,.9,2.5],blueGlow);
    cylinder(ship,.36,6.7,[side*7.7,-.48,-.2],steel,10);
    block(ship,[1.7,.5,2.7],[side*3.8,-.58,-2.8],edge);
    for(const z of [-1.4,-.6,.2,1.0])smallSlots(ship,side*4.0,z,steel);
    // Navigation / orientation points.
    block(ship,[.32,.31,.7],[side*10.4,.36,5.4],side>0?redGlow:blueGlow);
  }
  // Fully framed canopy from cockpit towards sharp forward nose.
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(1.6,16,10),glass);
  canopy.scale.set(1.08,.58,2.5);
  canopy.position.set(0,2.1,-4.7);ship.add(canopy);
  for(const z of [-6.7,-4.9,-3.1]){
    const brace=block(ship,[3.05,.12,.19],[0,2.47,z],steel);
    brace.rotation.x=-.18;
  }
  // 3 built-in ship-scale hull blocks, exhaust shields and decaling.
  block(ship,[3.0,.5,4],[0,-1.42,1.6],edge);
  block(ship,[2.4,.18,5.5],[0,-1.76,1.9],copper);
  for(const side of [-1,1]){
    block(ship,[.25,.65,9],[side*2.05,1.45,.4],steel);
    block(ship,[.18,.09,4.7],[side*1.35,2.49,-.2],copper);
    for(let z=-3;z<=5;z+=2){
      block(ship,[.18,.38,.7],[side*2.45,.7,z],edge);
    }
  }
  // A compact rear power module and two auxiliary jets.
  block(ship,[4.3,2.8,3.5],[0,0,6.7],edge);
  cylinder(ship,1.2,4.4,[0,-.35,7],armor,12);
  cylinder(ship,.78,.2,[0,-.35,9.25],blueGlow,16);
  for(const side of [-1,1]){
    block(ship,[1.5,.65,2.1],[side*1.55,-1.0,7.2],steel);
    block(ship,[1.25,.24,.5],[side*1.55,-1.2,8.3],redGlow);
  }
  return ship;
}

export function applyVanguardPbr(root:THREE.Group,blue:PbrTextureSet,worn:PbrTextureSet):void {
  const hull=createPbrMaterial(blue,0xb2c3d7);
  const detail=createPbrMaterial(worn,0xc4d3d7);
  hull.side=THREE.DoubleSide;
  root.traverse(child=>{
    if(!(child instanceof THREE.Mesh))return;
    if(child.userData.finish==='blue')child.material=hull;
    if(child.userData.finish==='worn')child.material=detail;
  });
}
