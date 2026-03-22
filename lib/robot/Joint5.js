// lib/robot/Joint5.js
import * as THREE from 'three';

export class Joint5 {
  constructor(parent) {
    this.parent = parent;

    this.group = new THREE.Object3D();
    this.parent.add(this.group);

    this.createJoint();
  }

  createJoint() {
    const geometry = new THREE.SphereGeometry(0.12, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });

    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);
  }

  setAngle(theta) {
    this.group.rotation.y = theta; // yaw
  }

  update() {
    this.group.rotation.y = Math.sin(Date.now() * 0.002) * 0.6;
  }
}