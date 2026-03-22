import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { RobotSystem } from '../robot/RobotSystem.js';

import { Frame2020 } from '../index.js';



export class RobotEngine {
  constructor(container) {
    this.sceneManager = new SceneManager(container);
    this.scene = this.sceneManager.scene;

    // Robot
    this.robot = new RobotSystem(this.scene);

    // Add frame
    new Frame2020(this.scene);

    // Target
    this.target = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    this.target.position.set(2, 1.5, 1);
    this.scene.add(this.target);

    // Mouse interaction
    this.initInteraction();

    // Loop
    this.animate();
  }

  initInteraction() {
    const renderer = this.sceneManager.renderer;

    renderer.domElement.addEventListener('click', (event) => {
      const rect = renderer.domElement.getBoundingClientRect();

      const mouse = this.sceneManager.mouse;
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.sceneManager.raycaster.setFromCamera(
        mouse,
        this.sceneManager.camera
      );

      const hits = this.sceneManager.raycaster.intersectObject(
        this.sceneManager.ground
      );

      if (hits.length > 0) {
        this.target.position.copy(hits[0].point);
        this.target.position.y += 0.1;
      }
    });
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    this.robot.update(this.target.position);
    this.sceneManager.render();
  };
}