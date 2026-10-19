import * as THREE from 'three';

export interface PbrTextureSet {
  diffuse: THREE.Texture;
  normal: THREE.Texture;
  arm: THREE.Texture;
}

function prepare(texture: THREE.Texture, isColor: boolean): THREE.Texture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function fetchSet(name: 'blue_metal_plate' | 'metal_plate_02'): Promise<PbrTextureSet> {
  const loader = new THREE.TextureLoader();
  const base = '/assets/materials/';
  const [diffuse, normal, arm] = await Promise.all([
    loader.loadAsync(base + name + '_diff_1k.png'),
    loader.loadAsync(base + name + '_nor_gl_1k.png'),
    loader.loadAsync(base + name + '_arm_1k.png')
  ]);
  return { diffuse: prepare(diffuse, true), normal: prepare(normal, false), arm: prepare(arm, false) };
}

export async function loadPbrSets(): Promise<{ blue: PbrTextureSet; worn: PbrTextureSet }> {
  const [blue, worn] = await Promise.all([fetchSet('blue_metal_plate'), fetchSet('metal_plate_02')]);
  return {blue, worn};
}

/**
 * Packed ORM/ARM follows glTF convention: R ambient occlusion, G roughness,
 * B metalness. Three.js map channels use these components automatically.
 * channel=0 shares original BoxGeometry UVs for ambient occlusion.
 */
export function createPbrMaterial(set: PbrTextureSet, color = 0xffffff): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    map: set.diffuse,
    normalMap: set.normal,
    roughnessMap: set.arm,
    metalnessMap: set.arm,
    aoMap: set.arm,
    metalness: 1,
    roughness: 1,
    aoMapIntensity: 0.8
  });
  material.aoMap!.channel = 0;
  return material;
}

export function releasePbrSets(sets: {blue: PbrTextureSet; worn: PbrTextureSet}): void {
  for (const s of [sets.blue, sets.worn]) {
    s.diffuse.dispose(); s.normal.dispose(); s.arm.dispose();
  }
}
