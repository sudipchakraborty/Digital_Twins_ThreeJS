// lib/workspace/WorkspaceFrame.js

import * as THREE from 'three';

export class WorkspaceFrame {   // ✅ IMPORTANT: "export"
  constructor(scene) {
    const geometry = new THREE.BoxGeometry(5, 3, 5);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });

    const frame = new THREE.LineSegments(edges, material);
    frame.position.y = 1.5;

    scene.add(frame);
  }
}