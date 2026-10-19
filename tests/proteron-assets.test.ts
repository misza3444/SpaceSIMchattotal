import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';

interface Material {
  pbrMetallicRoughness?: {baseColorTexture?: unknown;metallicRoughnessTexture?: unknown};
  normalTexture?: unknown;
  emissiveTexture?: unknown;
}
describe('CC-BY Proteron GLB source integrity',()=>{
  const manifest=JSON.parse(readFileSync('public/assets/ships/proteron-manifest.json','utf8')) as {
    creator:string;license:string;files:Record<string,{sha256:string;original_filename:string}>
  };
  it('preserves the required creator and license',()=>{
    expect(manifest.creator).toBe('Viktor Hahn');
    expect(manifest.license).toBe('CC-BY-4.0');
  });
  for(const filename of ['proteron-a.glb','proteron-b.glb']){
    it(filename+' has intact packed PBR maps',()=>{
      const bytes=readFileSync('public/assets/ships/'+filename);
      expect(bytes.toString('ascii',0,4)).toBe('glTF');
      expect(bytes.readUInt32LE(4)).toBe(2);
      expect(bytes.readUInt32LE(8)).toBe(bytes.length);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.files[filename]?.sha256);
      expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
      const jsonLength=bytes.readUInt32LE(12);
      const doc=JSON.parse(bytes.subarray(20,20+jsonLength).toString()) as {meshes?:unknown[];materials?:Material[]};
      const materials=doc.materials??[];
      expect(doc.meshes?.length).toBeGreaterThan(0);
      expect(materials.some(m=>Boolean(m.normalTexture))).toBe(true);
      expect(materials.some(m=>Boolean(m.pbrMetallicRoughness?.baseColorTexture))).toBe(true);
      expect(materials.some(m=>Boolean(m.pbrMetallicRoughness?.metallicRoughnessTexture))).toBe(true);
    });
  }
});
