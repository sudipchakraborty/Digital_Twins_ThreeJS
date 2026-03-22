// render/Floor.js
import * as THREE from 'three';

export class Floor {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.width = options.width || 6;
    this.depth = options.depth || 6;

    this.createFloor();
    this.createGrid();
  }

  createFloor() {
    const geometry = new THREE.PlaneGeometry(this.width, this.depth);

    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });

    const floor = new THREE.Mesh(geometry, material);

    floor.rotation.x = -Math.PI / 2; // make horizontal
    floor.receiveShadow = true;

    this.scene.add(floor);
    this.floor = floor;
  }

  createGrid() {
    const grid = new THREE.GridHelper(this.width, 20, 0x888888, 0x444444);
    this.scene.add(grid);
    this.grid = grid;
  }
}