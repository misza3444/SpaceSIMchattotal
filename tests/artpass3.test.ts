import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createModularSpaceStation, applyStationPbr } from '../src/render/station';
import { createVanguardPbrShip, applyVanguardPbr } from '../src/render/vanguard';
import { createPbrMaterial, type PbrTextureSet } from '../src/render/pbr-materials';
const texture=()=>new THREE.DataTexture(new Uint8Array([255,128,230,255]),1,1,THREE.RGBAFormat);
const set: PbrTextureSet={diffuse:texture(),normal:texture(),arm:texture()};
describe('Art pass 3 physical assets',()=>{
  it('constructs a real modular shipyard with instanced navigation lights',()=>{
    const station=createModularSpaceStation();
    expect(station.userData.moduleCount).toBe(12);
    let meshes=0,instanced=0;
    station.traverse(node=>{
      if(node instanceof THREE.Mesh) meshes++;
      if(node instanceof THREE.InstancedMesh) instanced+=node.count;
    });
    expect(meshes).toBeGreaterThan(100);
    expect(instanced).toBeGreaterThan(100);
    const size=new THREE.Box3().setFromObject(station).getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThan(500);
    expect(size.y).toBeGreaterThan(500);
    applyStationPbr(station,set,set);
    let textured=0;
    station.traverse(node=>{
      if(node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial && node.material.normalMap)textured++;
    });
    expect(textured).toBeGreaterThan(10);
  });
  it('builds a 3D Vanguard with asymmetric hard-surface details and PBR assignments',()=>{
    const ship=createVanguardPbrShip();
    const bounds=new THREE.Box3().setFromObject(ship).getSize(new THREE.Vector3());
    expect(bounds.z).toBeGreaterThan(20);
    expect(bounds.x).toBeGreaterThan(18);
    applyVanguardPbr(ship,set,set);
    let surfaces=0;
    ship.traverse(node=>{
      if(node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial && node.material.normalMap)surfaces++;
    });
    expect(surfaces).toBeGreaterThan(1);
  });
  it('correctly wires AO-roughness-metalness channels from ARM texture',()=>{
    const mat=createPbrMaterial(set);
    expect(mat.map).toBe(set.diffuse);
    expect(mat.normalMap).toBe(set.normal);
    expect(mat.aoMap).toBe(set.arm);
    expect(mat.roughnessMap).toBe(set.arm);
    expect(mat.metalnessMap).toBe(set.arm);
    expect(mat.aoMap!.channel).toBe(0);
  });
});
