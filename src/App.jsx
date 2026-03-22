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

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(2, 1.5, 2);

    // Renderer
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
    // 🔥 Frame ONLY
    // =========================
    // new Frame2020(scene);

    const points = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0)];
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xff0000 }));
scene.add(line);

// scene.add(new THREE.Points(
//   new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
//   new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 })
// ));

    // =========================
    // Controls
    // =========================
    const controls = new CameraController(camera, renderer);
    controls.controls.target.set(0, 0.5, 0);

    // =========================
    // Render Loop (NO animation needed)
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
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