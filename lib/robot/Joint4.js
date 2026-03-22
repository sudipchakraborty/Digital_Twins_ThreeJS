// lib/robot/Joint4.js
import * as THREE from 'three';

export class Joint4 {
  constructor(parent) {
    this.parent = parent;

    // rotation group
    this.group = new THREE.Object3D();
    this.parent.add(this.group);

    this.createJoint();
    this.createLink();
  }

  createJoint() {
    const geometry = new THREE.SphereGeometry(0.15, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });

    this.jointMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.jointMesh);
  }

  createLink() {
    const length = 0.6;

    const geometry = new THREE.BoxGeometry(0.15, length, 0.15);
    const material = new THREE.MeshStandardMaterial({ color: 0x66ccff });

    this.link = new THREE.Mesh(geometry, material);

    this.link.position.y = length / 2;
    this.group.add(this.link);

    // end point (tool mount)
    this.end = new THREE.Object3D();
    this.end.position.y = length;
    this.group.add(this.end);
  }

  setAngle(theta) {
    this.group.rotation.z = theta; // pitch
  }

  update() {
    // demo wrist motion
    this.group.rotation.z = Math.sin(Date.now() * 0.002) * 0.5;
  }
}