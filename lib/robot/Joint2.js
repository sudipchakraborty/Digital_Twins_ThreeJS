// lib/robot/Joint2.js
import * as THREE from 'three';

export class Joint2 {
  constructor(parent) {
    this.parent = parent;

    // Group for rotation
    this.group = new THREE.Object3D();
    this.group.position.y = 0.4; // sit on Joint1
    this.parent.add(this.group);

    this.createJoint();
    this.createLink();
  }

  createJoint() {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffaa });

    this.jointMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.jointMesh);
  }

  createLink() {
    const length = 1.5;

    const geometry = new THREE.BoxGeometry(0.2, length, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });

    this.link = new THREE.Mesh(geometry, material);

    // Move link upward from joint
    this.link.position.y = length / 2;

    this.group.add(this.link);

    // End point for next joint
    this.end = new THREE.Object3D();
    this.end.position.y = length;
    this.group.add(this.end);
  }

  setAngle(theta) {
    this.group.rotation.z = theta; // pitch
  }

  update() {
    this.group.rotation.z = Math.sin(Date.now() * 0.001) * 0.5;
  }
}
