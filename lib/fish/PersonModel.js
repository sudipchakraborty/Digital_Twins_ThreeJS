import * as THREE from 'three';
import { mesh, beam, disposeGroup } from './modelUtils.js';

/** Stylised rigged adult with a visible fishing net. Units: metres, Y up. */
export class PersonModel {
  constructor({ scale = 1, shirtColor = 0xe18c43, start = [21, 0.3, 19], destination = [13, 0.3, 17.8], walkSeconds = 4 } = {}) {
    if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(walkSeconds) || walkSeconds <= 0) throw new RangeError('invalid person scale or walk duration');
    for (const point of [start, destination]) if (!Array.isArray(point) || point.length !== 3 || !point.every(Number.isFinite)) throw new RangeError('invalid person path');
    this.group = new THREE.Group(); this.group.name = 'PersonWithFishingNet';
    this.body = new THREE.Group(); this.group.add(this.body); this.body.scale.setScalar(scale);
    this.start = new THREE.Vector3(...start); this.destination = new THREE.Vector3(...destination); this.walkSeconds = walkSeconds;
    const skin = new THREE.MeshStandardMaterial({ color: 0x9e6948, roughness: 0.88 });
    const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.85 });
    const trousers = new THREE.MeshStandardMaterial({ color: 0x283841, roughness: 0.93 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 0.9 });
    const shoes = new THREE.MeshStandardMaterial({ color: 0x182421, roughness: 1 });
    mesh(this.body, new THREE.CapsuleGeometry(0.23, 0.35, 6, 12), shirt, [0, 1.12, 0]);
    mesh(this.body, new THREE.CylinderGeometry(0.07, 0.08, 0.15, 10), skin, [0, 1.5, 0]);
    this.face = new THREE.Group(); this.face.name = 'FaceCaptureTarget'; this.face.rotation.order = 'YXZ'; this.face.position.y = 1.68; this.body.add(this.face);
    mesh(this.face, new THREE.SphereGeometry(0.16, 32, 24), skin);
    mesh(this.face, new THREE.SphereGeometry(0.162, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, [0, 0.03, 0]);
    mesh(this.face, new THREE.SphereGeometry(0.034, 16, 12), skin, [0, -0.02, -0.154]);
    const whites = new THREE.MeshStandardMaterial({ color: 0xe2d8cb, roughness: 0.7 });
    const lips = new THREE.MeshStandardMaterial({ color: 0x623b2a, roughness: 0.9 });
    for (const x of [-0.058, 0.058]) {
      const eye = mesh(this.face, new THREE.SphereGeometry(0.027, 16, 12), whites, [x, 0.02, -0.145]); eye.scale.set(1, 0.6, 0.5);
      mesh(this.face, new THREE.SphereGeometry(0.010, 12, 8), hair, [x, 0.02, -0.160]);
      mesh(this.face, new THREE.BoxGeometry(0.047, 0.010, 0.012), hair, [x, 0.052, -0.142]);
    }
    mesh(this.face, new THREE.BoxGeometry(0.052, 0.009, 0.012), lips, [0, -0.068, -0.142]);
    for (const x of [-0.158, 0.158]) { const ear = mesh(this.face, new THREE.SphereGeometry(0.035, 16, 12), skin, [x, -0.012, 0]); ear.scale.set(0.5, 1, 0.8); }
    this.legs = []; this.arms = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * 0.12, 0.82, 0); this.body.add(leg);
      mesh(leg, new THREE.CapsuleGeometry(0.10, 0.53, 5, 10), trousers, [0, -0.33, 0]);
      mesh(leg, new THREE.BoxGeometry(0.19, 0.12, 0.32), shoes, [0, -0.76, -0.07]); this.legs.push(leg);
      const arm = new THREE.Group(); arm.position.set(side * 0.29, 1.32, 0); this.body.add(arm);
      mesh(arm, new THREE.CapsuleGeometry(0.085, 0.15, 5, 10), shirt, [0, -0.12, 0]);
      mesh(arm, new THREE.CapsuleGeometry(0.068, 0.22, 5, 10), skin, [0, -0.39, 0]);
      mesh(arm, new THREE.SphereGeometry(0.075, 10, 8), skin, [0, -0.57, 0]); this.arms.push(arm);
    }
    this.net = new THREE.Group(); this.arms[1].add(this.net);
    const wood = new THREE.MeshStandardMaterial({ color: 0x80653d, roughness: 0.85 });
    beam(this.net, [0, -0.5, 0], [0, -0.5, -1.7], 0.025, wood);
    const rim = mesh(this.net, new THREE.TorusGeometry(0.58, 0.026, 6, 40), wood, [0, -0.5, -1.7]); rim.rotation.x = Math.PI / 2;
    const points = [];
    for (let i = 0; i < 24; i++) {
      const angle = i / 24 * Math.PI * 2;
      for (let j = 0; j < 5; j++) {
        const r = 0.58 * (1 - j / 6); const r2 = 0.58 * (1 - (j + 1) / 6);
        points.push(Math.cos(angle) * r, -0.5 - j * 0.13, -1.7 + Math.sin(angle) * r, Math.cos(angle) * r2, -0.5 - (j + 1) * 0.13, -1.7 + Math.sin(angle) * r2);
        const next = angle + Math.PI * 2 / 24;
        points.push(Math.cos(angle) * r, -0.5 - j * 0.13, -1.7 + Math.sin(angle) * r, Math.cos(next) * r, -0.5 - j * 0.13, -1.7 + Math.sin(next) * r);
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this.net.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xe4dcc3, transparent: true, opacity: 0.8 })));
    this.group.position.copy(this.start); this.group.visible = false;
  }
  update(elapsed) {
    if (!Number.isFinite(elapsed)) throw new RangeError('elapsed must be finite');
    this.group.visible = elapsed >= 0;
    if (elapsed < 0) return;
    this.face.rotation.set(0, 0, 0);
    const progress = THREE.MathUtils.clamp(elapsed / this.walkSeconds, 0, 1);
    this.group.position.lerpVectors(this.start, this.destination, progress);
    this.group.rotation.y = progress < 1 ? Math.atan2(-(this.destination.x - this.start.x), -(this.destination.z - this.start.z)) : 0;
    const stride = progress < 1 ? Math.sin(elapsed * 7) * 0.48 : 0;
    this.legs[0].rotation.x = stride; this.legs[1].rotation.x = -stride;
    this.arms[0].rotation.x = -stride * 0.6;
    this.arms[1].rotation.x = progress < 1 ? -0.15 : -0.35 + Math.sin(elapsed * 1.6) * 0.25;
    this.body.position.y = progress < 1 ? Math.abs(Math.sin(elapsed * 7)) * 0.035 : Math.sin(elapsed * 1.6) * 0.018;
  }
  getTarget() { this.group.updateWorldMatrix(true, true); return this.group.localToWorld(new THREE.Vector3(0, 1.05, 0)); }
  getFaceTarget() { this.group.updateWorldMatrix(true, true); return this.face.getWorldPosition(new THREE.Vector3()); }
  faceAtWorld(target) {
    this.group.updateWorldMatrix(true, true);
    const direction = this.body.worldToLocal(target.clone()).sub(this.face.position);
    this.face.rotation.set(0, Math.atan2(-direction.x, -direction.z), 0);
    const yawOnly = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.face.rotation.y);
    this.face.rotation.x = Math.atan2(yawOnly.y, -yawOnly.z);
    this.group.updateWorldMatrix(true, true);
  }
  dispose() { disposeGroup(this.group); }
}
