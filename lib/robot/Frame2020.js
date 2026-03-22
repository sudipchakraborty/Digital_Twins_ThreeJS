// lib/robot/Frame2020.js
import * as THREE from 'three';

export class Frame2020 {
  constructor(scene) {
    this.scene = scene;

    // Convert cm → meters
    this.profile = 0.02;

    this.L = 1.286; // length
    this.W = 0.578; // width
    this.H = 0.916; // height


    // this.innerL = 0.947;
    // this.innerH = 0.477;

this.material = new THREE.MeshStandardMaterial({
color: 0xffffff,
metalness: .8,
roughness: 0.2
});

    this.build();
  }

  // =========================
  // Helper: create beam
  // =========================
  beam(x, y, z, dx, dy, dz) {
    const geo = new THREE.BoxGeometry(dx, dy, dz);
    const mesh = new THREE.Mesh(geo, this.material);

    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  build() {
    const p = this.profile;
    const L = this.L;
    const W = this.W;
    const H = this.H;

    // =========================
    // Bottom frame
    // =========================
    this.beam(0, 0, 0, L, p, p);
    // this.beam(0, 0, W, L, p, p);

    // this.beam(-L/2, 0, W/2, p, p, W);
    // this.beam(L/2, 0, W/2, p, p, W);

    // =========================
    // Top frame
    // =========================
    // this.beam(0, H, 0, L, p, p);
    // this.beam(0, H, W, L, p, p);

    // this.beam(-L/2, H, W/2, p, p, W);
    // this.beam(L/2, H, W/2, p, p, W);

    // =========================
    // Vertical pillars
    // =========================
    // this.beam(-L/2, H/2, 0, p, H, p);
    // this.beam(L/2, H/2, 0, p, H, p);

    // this.beam(-L/2, H/2, W, p, H, p);
    // this.beam(L/2, H/2, W, p, H, p);

    // =========================
    // Inner platform
    // =========================
    // const innerY = this.innerH;

    // this.beam(0, innerY, 0, this.innerL, p, p);
    // this.beam(0, innerY, W, this.innerL, p, p);

    // this.beam(-this.innerL/2, innerY, W/2, p, p, W);
    // this.beam(this.innerL/2, innerY, W/2, p, p, W);
  }
}