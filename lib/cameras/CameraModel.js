import * as THREE from 'three';

/** Articulated housing. Layer 1 keeps the camera's own housing out of RGB feeds. */
export class CameraModel {
  constructor({ scale = 1, mode = 'ptz' } = {}) {
    this.group = new THREE.Group();
    this.pan = new THREE.Group();
    this.tilt = new THREE.Group();
    this.group.add(this.pan); this.pan.add(this.tilt);
    const white = new THREE.MeshStandardMaterial({ color: 0xe9edef, roughness: 0.35, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15242c, roughness: 0.28, metalness: 0.55 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x17394d, roughness: 0.1, metalness: 0.7 });
    const add = (geometry, material, parent, position) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position); mesh.castShadow = true; mesh.layers.set(1);
      parent.add(mesh); return mesh;
    };
    add(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 24), white, this.group, [0, 0.22, 0]);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 20), dark, this.pan, [0, 0.08, 0]);
    add(new THREE.BoxGeometry(0.6, 0.4, 0.7), white, this.tilt, [0, 0, 0.08]);
    const lens = add(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 24), dark, this.tilt, [0, 0, -0.31]);
    lens.rotation.x = Math.PI / 2;
    const front = add(new THREE.CircleGeometry(0.135, 24), glass, this.tilt, [0, 0, -0.38]);
    front.rotation.y = Math.PI;
    if (mode === 'ptz') add(new THREE.SphereGeometry(0.32, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, this.pan, [0, 0.1, 0.1]);
    this.group.scale.setScalar(scale);
  }
  setPose(panRadians, tiltRadians) {
    this.pan.rotation.y = -panRadians;
    this.tilt.rotation.x = tiltRadians;
  }
  dispose() {
    const geometries = new Set(); const materials = new Set();
    this.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
    this.group.removeFromParent();
  }
}
