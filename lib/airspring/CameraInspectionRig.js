import * as THREE from 'three';
import { mmToWorld } from './config.js';
import { disposeObject3D } from './dispose.js';
import { advancePingPong } from './motion.js';
import { InspectionCamera } from './InspectionCamera.js';
import { LeadScrewAxis } from './LeadScrewAxis.js';

export class CameraInspectionRig {
  constructor(settings, config) {
    this.group = new THREE.Group();
    this.group.name = 'CameraInspectionRig';
    this.group.userData.component = 'camera-inspection-rig';
    this.config = config;
    this.travelWorld = mmToWorld(settings.travelMm, config);
    this.lowerWorld = mmToWorld(settings.lowerLimitMm, config);
    this.heightMm = settings.travelMm;
    this.direction = -1;
    this.speedMmPerSecond = settings.verticalSpeedMmPerSecond;
    this.running = false;
    this.disposed = false;
    this.progress = 1;
    this.capturePulseSeconds = 0;
    this.axes = [];
    this.cameras = [];

    const offset = mmToWorld(settings.standOffsetMm, config);
    [-1, 1].forEach((side, index) => {
      const axis = new LeadScrewAxis({
        travelWorld: this.travelWorld,
        lowerWorld: this.lowerWorld,
        side,
      });
      axis.group.position.x = side * offset;
      axis.group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

      const camera = new InspectionCamera(`CAM-${index + 1}`);
      camera.group.position.z = side < 0 ? 0.09 : -0.09;
      axis.carriage.add(camera.group);

      this.axes.push(axis);
      this.cameras.push(camera);
      this.group.add(axis.group);
    });
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  setSpeed(mmPerSecond) {
    if (Number.isFinite(mmPerSecond) && mmPerSecond >= 0) {
      this.speedMmPerSecond = mmPerSecond;
    }
  }

  pulseCapture(durationSeconds = 0.16) {
    this.capturePulseSeconds = Math.max(this.capturePulseSeconds, durationSeconds);
    this.cameras.forEach((camera) => camera.setCapturing(true));
  }

  update(deltaSeconds, target = new THREE.Vector3()) {
    if (this.running && Number.isFinite(deltaSeconds) && deltaSeconds > 0) {
      const next = advancePingPong(
        { position: this.heightMm, direction: this.direction },
        this.speedMmPerSecond,
        0,
        this.config.cameras.travelMm,
        deltaSeconds,
      );
      this.heightMm = next.position;
      this.direction = next.direction;
      this.progress = this.heightMm / this.config.cameras.travelMm;
    }

    const travelPosition = mmToWorld(this.heightMm, this.config);
    this.axes.forEach((axis) => axis.setTravelPosition(travelPosition));
    this.group.updateMatrixWorld(true);
    this.cameras.forEach((camera) => camera.aimAt(target));

    if (this.capturePulseSeconds > 0) {
      this.capturePulseSeconds = Math.max(0, this.capturePulseSeconds - deltaSeconds);
      if (this.capturePulseSeconds === 0) {
        this.cameras.forEach((camera) => camera.setCapturing(false));
      }
    }
  }

  getCameraStates() {
    this.group.updateMatrixWorld(true);
    return this.cameras.map((camera) => ({
      cameraId: camera.cameraId,
      position: camera.group.getWorldPosition(new THREE.Vector3()),
      heightMm: this.heightMm,
    }));
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cameras.forEach((camera) => camera.dispose());
    this.axes.forEach((axis) => axis.dispose());
    disposeObject3D(this.group);
    this.group.clear();
  }
}
