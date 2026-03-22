// lib/robot/Joint3.js
import * as THREE from 'three';

export class Joint3 {
  constructor(parent) {
    this.parent = parent;

    // Rotation group
    this.group = new THREE.Object3D();
    this.parent.add(this.group);

    this.createJoint();
    this.createLink();
  }

  createJoint() {
    const geometry = new THREE.SphereGeometry(0.18, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff66cc });

    this.jointMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.jointMesh);
  }

  createLink() {
    const length = 1.2;

    const geometry = new THREE.BoxGeometry(0.18, length, 0.18);
    const material = new THREE.MeshStandardMaterial({ color: 0xff99dd });

    this.link = new THREE.Mesh(geometry, material);

    // move link upward
    this.link.position.y = length / 2;

    this.group.add(this.link);

    // end point for next joint
    this.end = new THREE.Object3D();
    this.end.position.y = length;
    this.group.add(this.end);
  }

  setAngle(theta) {
    this.group.rotation.z = theta;
  }

  update() {
    // demo motion (elbow bend)
    this.group.rotation.z = Math.cos(Date.now() * 0.001) * 0.6;
  }
}