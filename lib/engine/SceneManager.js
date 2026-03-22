import * as THREE from 'three';
import { CameraController, Floor } from '../index.js';

export class SceneManager {
  constructor(container) {
    this.container = container;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(6, 6, 6);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Floor
    new Floor(this.scene);

    // Controls
    this.controls = new CameraController(this.camera, this.renderer);
    this.controls.controls.target.set(0, 0.5, 0);

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Ground
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}