import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraController, Floor, Frame2020 } from '../lib/index.js';

function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // =========================
    // Scene
    // =========================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // =========================
    // Camera
    // =========================
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    // Better angle for Z-up robotics view
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    // =========================
    // Renderer
    // =========================
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // =========================
    // Lights
    // =========================
    const light = new THREE.DirectionalLight(0xffffff, 5);
    light.position.set(5, 10, 7);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    // =========================
    // Floor
    // =========================
    new Floor(scene);

    // =========================
    // 🔥 Frame (with axis helper)
    // =========================
    const frame = new Frame2020(scene);

    // =========================
    // Controls
    // =========================
    const controls = new CameraController(camera, renderer);

    // Target center of robot
    controls.controls.target.set(0, 0.5, 0);

    // =========================
    // 🎮 Keyboard control (Axis toggle)
    // =========================
    const handleKey = (e) => {
      if (e.key.toLowerCase() === 'a') {
        frame.toggleAxes();
        console.log('Axis toggled');
      }
    };

    window.addEventListener('keydown', handleKey);

    // =========================
    // Render Loop
    // =========================
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(render);

    // =========================
    // Resize
    // =========================
    const handleResize = () => {
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // =========================
    // Cleanup
    // =========================
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKey);

      renderer.dispose();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };

  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default App;