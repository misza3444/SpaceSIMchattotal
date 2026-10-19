import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type ShipVisualId = 'vanguard' | 'insurgent' | 'bob' | 'prototype';
export interface ShipVisualDefinition {
  id: ShipVisualId;
  label: string;
  source: string;
  description: string;
  uri: string | null;
}
export const SHIP_VISUALS: readonly ShipVisualDefinition[] = [
  {
    id: 'vanguard', label: 'VANGUARD', source: 'SpaceSIM · pełny PBR',
    description: 'Autorski okręt: panele PBR, wzmocnienia, dysze, radiatory', uri: null
  },
  {
    id: 'insurgent', label: 'INSURGENT', source: 'Quaternius · CC0',
    description: 'Smukły kadłub — kandydat na myśliwiec', uri: '/assets/ships/insurgent.gltf'
  },
  {
    id: 'bob', label: 'BOB', source: 'Quaternius · CC0',
    description: 'Cięższa sylwetka — kandydat na transportowiec', uri: '/assets/ships/bob.gltf'
  },
  {
    id: 'prototype', label: 'ISKRA 0.1', source: 'SpaceSIM · własny',
    description: 'Dotychczasowy model proceduralny', uri: null
  }
];
const assetLoader = new GLTFLoader();

export function prepareImportedShip(root: THREE.Group): THREE.Group {
  // Blender/glTF forward conventions vary. Align the model and guarantee a consistent
  // 20 m silhouette without changing the simulation's separate physics contract.
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  if (bounds.isEmpty()) throw new Error('Imported spaceship contains no visible geometry');
  const size = bounds.getSize(new THREE.Vector3());
  const major = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(major) || major <= 0) throw new Error('Invalid spaceship bounds');
  const scale = 21 / major;
  const center = bounds.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  root.position.sub(center);
  root.scale.setScalar(scale);
  // Quaternius Blender glTF ships commonly use their long axis as Y;
  // normalization is visual only and does not alter the 6DOF simulation.
  if (size.y > size.z * 1.18 && size.y > size.x * 1.18) root.rotation.x = -Math.PI / 2;
  if (size.x > size.z * 1.2 && size.x > size.y * 1.2) root.rotation.y = -Math.PI / 2;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      // Preserve original Quaternius diffuse textures while giving hulls controlled
      // specular response. This is a PBR-tuned material, not a 4K PBR texture set.
      material.metalness = 0.22;
      material.roughness = 0.62;
      material.envMapIntensity = 1;
      material.needsUpdate = true;
    }
  });
  wrapper.add(root);
  return wrapper;
}

export async function loadShipVisual(visual: ShipVisualDefinition): Promise<THREE.Group> {
  if (!visual.uri) throw new Error('The prototype is created locally');
  const loaded = await assetLoader.loadAsync(visual.uri);
  return prepareImportedShip(loaded.scene);
}
