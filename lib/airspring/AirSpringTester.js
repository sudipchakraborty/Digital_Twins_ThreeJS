import * as THREE from 'three';
import { AirSpring } from './AirSpring.js';
import { CameraInspectionRig } from './CameraInspectionRig.js';
import { createAirSpringTesterConfig, mmToWorld } from './config.js';
import { InspectionController } from './InspectionController.js';
import { TesterFrame } from './TesterFrame.js';
import { Turntable } from './Turntable.js';

export class AirSpringTester {
  constructor(inputConfig = {}) {
    this.config = createAirSpringTesterConfig(inputConfig);
    this.group = new THREE.Group();
    this.group.name = 'AirSpringTester';
    this.group.userData.component = 'air-spring-tester';
    this.running = false;
    this.disposed = false;

    this.frame = new TesterFrame();
    this.turntable = new Turntable(this.config.turntable, this.config);
    this.airSpring = new AirSpring(this.config.airSpring, this.config);
    this.cameraRig = new CameraInspectionRig(this.config.cameras, this.config);
    this.inspection = new InspectionController({
      ...this.config.inspection,
      onCapture: this.config.onCapture,
      onInspection: this.config.onInspection,
    });

    this.airSpring.group.position.y = this.turntable.surfaceHeight;
    this.turntable.mount.add(this.airSpring.group);
    this.group.add(this.frame.group, this.turntable.group, this.cameraRig.group);

    this.inspectionTarget = new THREE.Vector3(
      0,
      this.turntable.surfaceHeight
        + mmToWorld(this.config.airSpring.heightMm, this.config) / 2,
      0,
    );
    this.cameraRig.update(0, this.inspectionTarget);
  }

  start() {
    if (this.disposed) return;
    this.running = true;
    this.turntable.start();
    this.cameraRig.start();
  }

  stop() {
    this.running = false;
    this.turntable.stop();
    this.cameraRig.stop();
  }

  setTurntableSpeed(rpm) {
    this.turntable.setSpeed(rpm);
    if (Number.isFinite(rpm)) this.config.turntable.speedRpm = rpm;
  }

  setCameraSpeed(mmPerSecond) {
    this.cameraRig.setSpeed(mmPerSecond);
    if (Number.isFinite(mmPerSecond) && mmPerSecond >= 0) {
      this.config.cameras.verticalSpeedMmPerSecond = mmPerSecond;
    }
  }

  update(deltaSeconds) {
    if (this.disposed || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    this.turntable.update(deltaSeconds);
    this.cameraRig.update(deltaSeconds, this.inspectionTarget);

    if (this.running) {
      const crossings = this.inspection.update(
        deltaSeconds,
        this.turntable.speedRpm,
        this.cameraRig.getCameraStates(),
      );
      if (crossings > 0) this.cameraRig.pulseCapture();
    }
  }

  getStatus() {
    return {
      running: this.running,
      angleRadians: this.turntable.angleRadians,
      turntableSpeedRpm: this.turntable.speedRpm,
      cameraHeightMm: this.cameraRig.heightMm,
      cameraDirection: this.cameraRig.direction,
      cameraSpeedMmPerSecond: this.cameraRig.speedMmPerSecond,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.inspection.dispose();
    this.airSpring.dispose();
    this.cameraRig.dispose();
    this.turntable.dispose();
    this.frame.dispose();
    this.group.clear();
  }
}
