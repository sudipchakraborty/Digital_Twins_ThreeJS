import * as THREE from 'three';
import { mmToWorld } from './config.js';
import { disposeObject3D } from './dispose.js';
import { rpmToRadiansPerSecond } from './motion.js';

const TAU = Math.PI * 2;

export class Turntable {
  constructor(settings, config) {
    this.group = new THREE.Group();
    this.group.name = 'Turntable';
    this.group.userData.component = 'turntable';
    this.mount = new THREE.Group();
    this.mount.name = 'RotatingMount';
    this.group.add(this.mount);

    this.speedRpm = settings.speedRpm;
    this.angleRadians = 0;
    this.running = false;
    this.disposed = false;

    const diameter = mmToWorld(settings.diameterMm, config);
    const height = mmToWorld(settings.heightMm, config);
    const radius = diameter / 2;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x30373d,
      roughness: 0.48,
      metalness: 0.68,
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xaeb7bf,
      roughness: 0.3,
      metalness: 0.82,
    });
    const platterMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f6971,
      roughness: 0.36,
      metalness: 0.78,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.06, radius * 1.12, height * 0.72, 64),
      baseMaterial,
    );
    base.name = 'TurntableBase';
    base.position.y = height * 0.36;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);

    const bearing = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, height * 0.34, 48),
      edgeMaterial,
    );
    bearing.name = 'CentralBearing';
    bearing.position.y = height * 0.78;
    this.group.add(bearing);

    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height * 0.28, 96),
      platterMaterial,
    );
    platter.name = 'RotatingPlatter';
    platter.position.y = height * 0.86;
    platter.castShadow = true;
    platter.receiveShadow = true;
    this.mount.add(platter);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.96, height * 0.07, 10, 96),
      edgeMaterial,
    );
    rim.name = 'PlatterRim';
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height;
    this.mount.add(rim);

    const motor = new THREE.Group();
    motor.name = 'DCMotor';
    const motorBody = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.55, height * 0.55, radius * 0.72, 32),
      new THREE.MeshStandardMaterial({ color: 0x176b87, roughness: 0.46, metalness: 0.62 }),
    );
    motorBody.rotation.z = Math.PI / 2;
    motorBody.castShadow = true;
    motor.add(motorBody);
    const motorCap = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.58, height * 0.58, height * 0.16, 32),
      edgeMaterial,
    );
    motorCap.rotation.z = Math.PI / 2;
    motorCap.position.x = radius * 0.42;
    motor.add(motorCap);
    motor.position.set(radius * 1.18, height * 0.48, 0);
    this.group.add(motor);

    const coupling = new THREE.Mesh(
      new THREE.CylinderGeometry(height * 0.16, height * 0.16, radius * 0.42, 24),
      edgeMaterial,
    );
    coupling.name = 'MotorCoupling';
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(radius * 0.78, height * 0.48, 0);
    this.group.add(coupling);

    this.surfaceHeight = height;
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  setSpeed(rpm) {
    if (Number.isFinite(rpm)) this.speedRpm = rpm;
  }

  update(deltaSeconds) {
    if (!this.running || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const next = this.angleRadians
      + rpmToRadiansPerSecond(this.speedRpm) * deltaSeconds;
    this.angleRadians = ((next % TAU) + TAU) % TAU;
    this.mount.rotation.y = this.angleRadians;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject3D(this.group);
    this.group.clear();
  }
}
