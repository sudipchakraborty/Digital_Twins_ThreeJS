// controls/CameraController.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class CameraController {
  constructor(camera, renderer) {
    this.controls = new OrbitControls(camera, renderer.domElement);

    // =========================
    // 🎮 Basic Controls
    // =========================
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;

    // =========================
    // 🔥 Zoom Improvements
    // =========================
    this.controls.zoomSpeed = 1.5;       // faster zoom
    this.controls.minDistance = 0.1;     // VERY IMPORTANT (close zoom)
    this.controls.maxDistance = 100;     // far zoom

    // =========================
    // 🎯 Target (CRITICAL FIX)
    // =========================
    this.controls.target.set(0, 0.5, 0);

    // =========================
    // 🔄 Movement Tuning
    // =========================
    this.controls.panSpeed = 1.2;
    this.controls.rotateSpeed = 1.0;

    // =========================
    // 🚫 Prevent Camera Flip
    // =========================
    this.controls.maxPolarAngle = Math.PI / 2;

    // =========================
    // 🔥 Advanced (CAD-like feel)
    // =========================
    this.controls.screenSpacePanning = true;
    this.controls.zoomToCursor = true;   // 🔥 BEST FEATURE

    // Apply initial state
    this.controls.update();
  }

  update() {
    this.controls.update();
  }
}