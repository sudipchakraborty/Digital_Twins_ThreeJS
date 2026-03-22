// lib/robot/RobotBase.js
import * as THREE from 'three';

export class RobotBase {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.radius = options.radius || 0.5;
    this.height = options.height || 0.2;

    this.createBase();
  }

  createBase() {
    // Base geometry (cylinder)
    const geometry = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      this.height,
      32
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x0077ff
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Place on floor
    this.mesh.position.y = this.height / 2;

    this.scene.add(this.mesh);

    // Add local axis (VERY IMPORTANT)
    const axes = new THREE.AxesHelper(1);
    this.mesh.add(axes);
  }
}