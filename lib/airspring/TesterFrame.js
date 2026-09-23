import * as THREE from 'three';
import { disposeObject3D } from './dispose.js';

export class TesterFrame {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TesterFrame';
    this.group.userData.component = 'tester-frame';
    this.disposed = false;

    const profileMaterial = new THREE.MeshStandardMaterial({
      color: 0xaeb8bf,
      roughness: 0.3,
      metalness: 0.82,
    });
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e353a,
      roughness: 0.42,
      metalness: 0.68,
    });
    const guardMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5ad36,
      roughness: 0.45,
      metalness: 0.52,
    });

    const beam = (name, size, position, material = profileMaterial) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };

    const width = 1.04;
    const depth = 0.74;
    const height = 0.78;
    const profile = 0.026;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        beam(
          `FramePost-${xSide}-${zSide}`,
          [profile, height, profile],
          [xSide * width / 2, height / 2, zSide * depth / 2],
        );
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.045, 0.035, 24),
          jointMaterial,
        );
        foot.name = 'AdjustableFoot';
        foot.position.set(xSide * width / 2, -0.02, zSide * depth / 2);
        this.group.add(foot);
      });
    });

    [-1, 1].forEach((zSide) => {
      beam('LowerCrossMember', [width + profile, profile, profile], [0, 0.07, zSide * depth / 2]);
      beam('UpperCrossMember', [width + profile, profile, profile], [0, height, zSide * depth / 2]);
    });
    [-1, 1].forEach((xSide) => {
      beam('SideUpperMember', [profile, profile, depth + profile], [xSide * width / 2, height, 0]);
      beam('SideLowerMember', [profile, profile, depth + profile], [xSide * width / 2, 0.07, 0]);
    });

    beam('LeftAxisMount', [0.14, 0.06, 0.16], [-0.39, 0.1, 0], jointMaterial);
    beam('RightAxisMount', [0.14, 0.06, 0.16], [0.39, 0.1, 0], jointMaterial);
    beam('MotorGuard', [0.13, 0.1, 0.18], [0.32, 0.08, 0], guardMaterial);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject3D(this.group);
    this.group.clear();
  }
}
