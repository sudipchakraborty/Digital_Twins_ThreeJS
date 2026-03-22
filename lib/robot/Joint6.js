// lib/robot/Joint6.js
import * as THREE from 'three';

export class Joint6 {
  constructor(parent) {
    this.parent = parent;

    this.group = new THREE.Object3D();
    this.parent.add(this.group);

    this.createTool();
  }

  createTool() {
    // Tool (gripper placeholder)
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    this.tool = new THREE.Mesh(geometry, material);
    this.tool.rotation.x = Math.PI / 2;

    this.group.add(this.tool);
  }

  setAngle(theta) {
    this.group.rotation.z = theta; // roll
  }

  update() {
    this.group.rotation.z += 0.05; // spin
  }
}