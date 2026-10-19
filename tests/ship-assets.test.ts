import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { prepareImportedShip, SHIP_VISUALS } from '../src/render/ship-library';

const known:Record<string,string>={
  insurgent:'a6e75f658d4133bf8e96172a410b1daa8c3a8179f9c77b033f9d9cdaa04cb419',
  bob:'73f187cd1a11e487a1b20405bfa59d3d9f98ef4960ee64e3f062a7373aa095ad'
};
describe('Art Pass 2 licensed assets',()=>{
  it('vendors two distinct standalone CC0 glTF spaceships intact',()=>{
    for(const id of ['insurgent','bob']){
      const bytes=readFileSync('public/assets/ships/'+id+'.gltf');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(known[id]);
      const doc=JSON.parse(bytes.toString('utf8')) as {
        asset:{version:string}; meshes:unknown[];
        buffers:{uri?:string}[]; images?:{uri?:string;bufferView?:number}[];
      };
      expect(doc.asset.version.startsWith('2.')).toBe(true);
      expect(doc.meshes.length).toBeGreaterThan(0);
      expect(doc.buffers.every(b=>b.uri?.startsWith('data:'))).toBe(true);
      expect(doc.images?.every(im=>Boolean(im.uri?.startsWith('data:')||im.bufferView!==undefined))??true).toBe(true);
    }
    expect(SHIP_VISUALS.map(x=>x.id)).toEqual(['vanguard','insurgent','bob','prototype']);
  });
  it('normalizes imported model dimensions and tunes metallic materials',()=>{
    const root=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial();
    const hull=new THREE.Mesh(new THREE.BoxGeometry(3,12,4),mat);
    root.add(hull);
    const wrapper=prepareImportedShip(root);
    const box=new THREE.Box3().setFromObject(wrapper);
    expect(Math.max(...box.getSize(new THREE.Vector3()).toArray())).toBeCloseTo(21,0);
    expect(mat.metalness).toBeCloseTo(.22);
    expect(mat.roughness).toBeCloseTo(.62);
  });
});
