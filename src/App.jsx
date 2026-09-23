import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AirSpringTester, CameraController } from '../lib/index.js';
import './index.css';
import './App.css';

const INITIAL_CAMERA_POSITION = new THREE.Vector3(1.28, 0.86, 1.32);
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0.34, 0);

const TESTER_CONFIG = {
  units: { millimetresPerWorldUnit: 1000 },
  airSpring: {
    outerDiameterMm: 300,
    innerDiameterMm: 120,
    heightMm: 260,
  },
  turntable: { diameterMm: 500, speedRpm: 2 },
  cameras: {
    count: 2,
    travelMm: 450,
    verticalSpeedMmPerSecond: 20,
  },
  inspection: { captureAngleStepDegrees: 30 },
};

function disposeMesh(mesh) {
  mesh.geometry?.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.filter(Boolean).forEach((material) => material.dispose());
}

function App() {
  const mountRef = useRef(null);
  const testerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [status, setStatus] = useState({
    rpm: 2,
    cameraHeightMm: 450,
    cameraDirection: -1,
    angleDegrees: 0,
  });
  const [lastCapture, setLastCapture] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let mounted = true;
    let statusAccumulator = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111820);
    scene.fog = new THREE.Fog(0x111820, 2.2, 4.5);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.01,
      20,
    );
    camera.position.copy(INITIAL_CAMERA_POSITION);
    camera.lookAt(INITIAL_CAMERA_TARGET);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new CameraController(camera, renderer);
    controls.controls.target.copy(INITIAL_CAMERA_TARGET);
    controls.controls.minDistance = 0.65;
    controls.controls.maxDistance = 3.5;
    controls.controls.maxPolarAngle = Math.PI * 0.48;
    controls.controls.update();
    controlsRef.current = controls;

    const hemisphere = new THREE.HemisphereLight(0xdceeff, 0x28313a, 1.45);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(1.8, 2.6, 1.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -1.4;
    keyLight.shadow.camera.right = 1.4;
    keyLight.shadow.camera.top = 1.4;
    keyLight.shadow.camera.bottom = -1.4;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x71c9e8, 1.6);
    fillLight.position.set(-1.5, 1.1, -1.4);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 96),
      new THREE.MeshStandardMaterial({
        color: 0x273039,
        roughness: 0.92,
        metalness: 0.08,
      }),
    );
    floor.name = 'InspectionCellFloor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(4.5, 30, 0x6d7982, 0x38434c);
    grid.position.y = -0.038;
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    scene.add(grid);

    const tester = new AirSpringTester({
      ...TESTER_CONFIG,
      onCapture: (capture) => {
        if (mounted) setLastCapture(capture);
      },
    });
    tester.group.rotation.y = -0.16;
    scene.add(tester.group);
    tester.start();
    testerRef.current = tester;

    const clock = new THREE.Clock();
    const render = () => {
      const deltaSeconds = Math.min(clock.getDelta(), 0.1);
      tester.update(deltaSeconds);
      controls.update();
      renderer.render(scene, camera);

      statusAccumulator += deltaSeconds;
      if (mounted && statusAccumulator >= 0.1) {
        statusAccumulator = 0;
        const testerStatus = tester.getStatus();
        setStatus({
          rpm: testerStatus.turntableSpeedRpm,
          cameraHeightMm: testerStatus.cameraHeightMm,
          cameraDirection: testerStatus.cameraDirection,
          angleDegrees: THREE.MathUtils.radToDeg(testerStatus.angleRadians),
        });
      }
    };
    renderer.setAnimationLoop(render);

    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      tester.dispose();
      controls.controls.dispose();
      disposeMesh(floor);
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      testerRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  const toggleRunning = () => {
    const tester = testerRef.current;
    if (!tester) return;
    if (running) tester.stop();
    else tester.start();
    setRunning((current) => !current);
  };

  const resetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current?.controls;
    if (!camera || !controls) return;
    camera.position.copy(INITIAL_CAMERA_POSITION);
    controls.target.copy(INITIAL_CAMERA_TARGET);
    controls.update();
  };

  return (
    <main className="simulation-shell">
      <div className="viewport" ref={mountRef} aria-label="Air spring tester 3D simulation" />

      <header className="topbar">
        <div className="title-block">
          <span className="eyebrow">Digital twin</span>
          <h1>Air Spring Tester</h1>
        </div>
        <div className={`machine-state ${running ? 'is-running' : ''}`}>
          <span className="state-dot" aria-hidden="true" />
          {running ? 'Inspection running' : 'Inspection paused'}
        </div>
      </header>

      <section className="telemetry" aria-label="Machine telemetry">
        <div className="metric">
          <span>Turntable</span>
          <strong>{status.rpm.toFixed(1)} <small>RPM</small></strong>
        </div>
        <div className="metric">
          <span>Camera height</span>
          <strong>{status.cameraHeightMm.toFixed(0)} <small>mm</small></strong>
        </div>
        <div className="metric metric-direction">
          <span>Travel</span>
          <strong>{status.cameraDirection < 0 ? 'Down' : 'Up'}</strong>
        </div>
        <div className="metric metric-angle">
          <span>Table angle</span>
          <strong>{status.angleDegrees.toFixed(0)}<small> deg</small></strong>
        </div>
      </section>

      <footer className="controlbar">
        <div className="capture-status" aria-live="polite">
          <span className="capture-mark" aria-hidden="true" />
          <div>
            <span>Latest capture</span>
            <strong>
              {lastCapture
                ? `${lastCapture.cameraId} / ${lastCapture.heightMm.toFixed(0)} mm`
                : 'Awaiting first scan'}
            </strong>
          </div>
        </div>

        <div className="controls">
          <button
            className="control-button primary"
            type="button"
            onClick={toggleRunning}
            aria-label={running ? 'Pause simulation' : 'Start simulation'}
            title={running ? 'Pause simulation' : 'Start simulation'}
          >
            <span className={running ? 'pause-icon' : 'play-icon'} aria-hidden="true" />
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            className="control-button"
            type="button"
            onClick={resetView}
            aria-label="Reset camera view"
            title="Reset camera view"
          >
            <span className="reset-icon" aria-hidden="true">R</span>
            Reset view
          </button>
        </div>
      </footer>
    </main>
  );
}

export default App;
