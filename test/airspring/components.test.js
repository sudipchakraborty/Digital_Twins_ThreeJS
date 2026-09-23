import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AirSpring } from '../../lib/airspring/AirSpring.js';
import { Turntable } from '../../lib/airspring/Turntable.js';
import { createAirSpringTesterConfig } from '../../lib/airspring/config.js';

test('builds a dimensioned two-bellows air spring', () => {
  const config = createAirSpringTesterConfig();
  const spring = new AirSpring(config.airSpring, config);
  const bounds = new THREE.Box3().setFromObject(spring.group);
  const size = bounds.getSize(new THREE.Vector3());

  assert.equal(spring.group.userData.component, 'air-spring');
  assert.equal(spring.group.userData.bellowsCount, 2);
  assert.ok(spring.group.children.length >= 6);
  assert.ok(Math.abs(size.x - 0.3) < 0.015);
  assert.ok(Math.abs(size.y - 0.26) < 0.015);
  assert.doesNotThrow(() => {
    spring.dispose();
    spring.dispose();
  });
});

test('rotates the mounted assembly at two RPM', () => {
  const config = createAirSpringTesterConfig();
  const table = new Turntable(config.turntable, config);

  table.start();
  table.update(7.5);

  assert.ok(Math.abs(table.angleRadians - Math.PI / 2) < 1e-9);
  assert.equal(table.mount.rotation.y, table.angleRadians);
  assert.doesNotThrow(() => {
    table.dispose();
    table.dispose();
  });
});

test('supports stopped and reverse turntable motion', () => {
  const config = createAirSpringTesterConfig();
  const table = new Turntable(config.turntable, config);

  table.update(5);
  assert.equal(table.angleRadians, 0);

  table.setSpeed(-2);
  table.start();
  table.update(7.5);
  assert.ok(Math.abs(table.angleRadians - Math.PI * 1.5) < 1e-9);
});
