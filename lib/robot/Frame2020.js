// lib/robot/Frame2020.js
import * as THREE from 'three';
import { AxisHelper3D } from '../helpers/AxisHelper.js';

export class Frame2020 {
  constructor(scene) {
    this.scene = scene;

    // =========================
    // 🔥 Z-UP WORLD (Robotics frame)
    // =========================
    this.world = new THREE.Group();
    this.world.rotation.x = -Math.PI / 2;
    this.scene.add(this.world);

    // =========================
    // 🔹 Frame Group (structure only)
    // =========================
    this.frame = new THREE.Group();
    this.world.add(this.frame);

    // =========================
    // 🔹 Axis Helper (modular)
    // =========================
    this.axisHelper = new AxisHelper3D(this.world, 0.5);

    // =========================
    // Dimensions (meters)
    // =========================
    this.profile = 0.02;
    this.L = 1.286;
    this.W = 0.578;
    this.H = 0.916;

    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.2
    });

    this.build();
  }

  // =========================
  // Beam creator
  // =========================
  beam(x, y, z, dx, dy, dz) {
    const geo = new THREE.BoxGeometry(dx, dy, dz);
    const mesh = new THREE.Mesh(geo, this.material);

    mesh.position.set(x, y, z);
    this.frame.add(mesh);
  }

  // =========================
  // Build frame
  // =========================
  build() {
    const p = this.profile;
    const L = this.L;
    const W = this.W;
    const H = this.H;

    // =========================
    // Bottom frame
    // =========================
    this.beam(0, 0, 0,1.286, p, p);
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
    // Mid platform
    // =========================
    // const M = 0.477;
    // this.beam(0, M, 0, L, p, p);
    // this.beam(0, M, W, L, p, p);
    // this.beam(-L/2, M, W/2, p, p, W);
    // this.beam(L/2, M, W/2, p, p, W);

    // =========================
    // Mid2 platform
    // =========================
    // const M2 = 0.617;
    // const M2_Left = 0.6;
    // this.beam(0, M2, 0.5, M2_Left, p, p);
  }

  // =========================
  // Axis control helpers
  // =========================
  showAxes() {
    this.axisHelper.show();
  }

  hideAxes() {
    this.axisHelper.hide();
  }

  toggleAxes() {
    this.axisHelper.toggle();
  }
}