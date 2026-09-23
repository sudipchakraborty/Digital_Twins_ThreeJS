import * as THREE from 'three';
import { disposeObject3D } from './dispose.js';

export class InspectionCamera {
  constructor(cameraId) {
    this.cameraId = cameraId;
    this.group = new THREE.Group();
    this.group.name = `InspectionCamera-${cameraId}`;
    this.group.userData = { component: 'inspection-camera', cameraId };
    this.disposed = false;

    const housingMaterial = new THREE.MeshStandardMaterial({
      color: 0xe1e5e8,
      roughness: 0.38,
      metalness: 0.62,
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x20262b,
      roughness: 0.34,
      metalness: 0.7,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x19465b,
      roughness: 0.08,
      metalness: 0.18,
      transmission: 0.22,
      clearcoat: 1,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.075, 0.12),
      housingMaterial,
    );
    body.name = 'CameraHousing';
    body.position.z = 0.035;
    body.castShadow = true;
    this.group.add(body);

    const lensBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.036, 0.048, 32),
      darkMaterial,
    );
    lensBarrel.name = 'LensBarrel';
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.z = 0.118;
    this.group.add(lensBarrel);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.025, 32),
      glassMaterial,
    );
    lens.name = 'Lens';
    lens.position.z = 0.143;
    this.group.add(lens);

    this.statusLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x48d597,
      emissive: 0x123b2d,
      emissiveIntensity: 1,
    });
    const statusLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 16, 12),
      this.statusLightMaterial,
    );
    statusLight.name = 'CameraStatusLight';
    statusLight.position.set(0.033, 0.025, 0.098);
    this.group.add(statusLight);

    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0.145),
      new THREE.Vector3(0, 0, 0.42),
    ]);
    this.viewLine = new THREE.Line(
      rayGeometry,
      new THREE.LineBasicMaterial({ color: 0x49c5e8, transparent: true, opacity: 0.42 }),
    );
    this.viewLine.name = 'ViewDirection';
    this.group.add(this.viewLine);
  }

  aimAt(worldTarget) {
    this.group.lookAt(worldTarget);
  }

  setCapturing(active) {
    this.statusLightMaterial.emissiveIntensity = active ? 5 : 1;
    this.viewLine.material.opacity = active ? 0.95 : 0.42;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject3D(this.group);
    this.group.clear();
  }
}
