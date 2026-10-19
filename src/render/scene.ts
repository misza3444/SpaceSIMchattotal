import * as THREE from 'three';
export class SpaceView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000);
  private readonly renderer: THREE.WebGLRenderer;
  constructor(host: HTMLElement) {
    this.scene.background = new THREE.Color('#040a12');
    this.camera.position.set(0, 0, 8);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.append(this.renderer.domElement);
    this.resize(host.clientWidth, host.clientHeight);
  }
  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
  }
  draw(alpha: number): void { void alpha; this.renderer.render(this.scene, this.camera); }
  dispose(): void { this.renderer.dispose(); this.renderer.domElement.remove(); }
}
