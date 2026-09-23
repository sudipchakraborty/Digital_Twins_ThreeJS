import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CameraInspectionRig } from '../../lib/airspring/CameraInspectionRig.js';
import { createAirSpringTesterConfig } from '../../lib/airspring/config.js';

test('starts two opposing cameras at the top and moves them downward', () => {
  const config = createAirSpringTesterConfig();
  const rig = new CameraInspectionRig(config.cameras, config);

  assert.equal(rig.heightMm, 450);
  assert.equal(rig.direction, -1);

  rig.start();
  rig.update(5, new THREE.Vector3(0, 0.3, 0));

  const states = rig.getCameraStates();
  assert.equal(states.length, 2);
  assert.equal(rig.heightMm, 350);
  assert.equal(rig.direction, -1);
  assert.ok(states.every(({ cameraId }) => cameraId));
  assert.ok(states[0].position.x * states[1].position.x < 0);
});

test('reverses camera travel at both limits for a large frame delta', () => {
  const config = createAirSpringTesterConfig();
  const rig = new CameraInspectionRig(config.cameras, config);

  rig.start();
  rig.update(30, new THREE.Vector3(0, 0.25, 0));

  assert.ok(rig.heightMm >= 0 && rig.heightMm <= 450);
  assert.equal(rig.heightMm, 150);
  assert.equal(rig.direction, 1);
  assert.ok(rig.progress >= 0 && rig.progress <= 1);
});

test('supports stopped motion, speed changes, and repeated disposal', () => {
  const config = createAirSpringTesterConfig();
  const rig = new CameraInspectionRig(config.cameras, config);

  rig.update(10, new THREE.Vector3());
  assert.equal(rig.heightMm, 450);

  rig.setSpeed(45);
  rig.start();
  rig.update(2, new THREE.Vector3());
  assert.equal(rig.heightMm, 360);

  assert.doesNotThrow(() => {
    rig.dispose();
    rig.dispose();
  });
});
