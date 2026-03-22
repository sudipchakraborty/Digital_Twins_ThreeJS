// lib/robot/Joint1.js
import * as THREE from 'three';

export class Joint1 {
  constructor(parent) {
    this.parent = parent;

    this.group = new THREE.Object3D();
    this.parent.add(this.group);

    this.createJoint();
  }

  createJoint() {
    // Visual cylinder (joint body)
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 0.2;

    this.group.add(this.mesh);

    // Axis helper (local)
    const axes = new THREE.AxesHelper(1);
    this.group.add(axes);
  }

  setAngle(theta) {
    // Rotate around Z axis
    this.group.rotation.y = theta;
  }

  update(delta = 0.01) {
    this.group.rotation.y += delta;
  }
}