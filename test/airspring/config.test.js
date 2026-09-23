import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAirSpringTesterConfig,
  mmToWorld,
} from '../../lib/airspring/config.js';

test('normalizes defaults and converts millimetres', () => {
  const config = createAirSpringTesterConfig();

  assert.equal(config.airSpring.outerDiameterMm, 300);
  assert.equal(config.airSpring.innerDiameterMm, 120);
  assert.equal(config.airSpring.heightMm, 260);
  assert.equal(mmToWorld(500, config), 0.5);
});

test('falls back for non-finite and conflicting dimensions', () => {
  const warnings = [];
  const config = createAirSpringTesterConfig({
    airSpring: { outerDiameterMm: Number.NaN, innerDiameterMm: 400 },
    turntable: { diameterMm: 100 },
  }, (message) => warnings.push(message));

  assert.equal(config.airSpring.outerDiameterMm, 300);
  assert.equal(config.airSpring.innerDiameterMm, 120);
  assert.ok(config.turntable.diameterMm >= config.airSpring.outerDiameterMm);
  assert.ok(warnings.length >= 2);
});

test('accepts zero motor speed and rejects invalid scale and camera values', () => {
  const warnings = [];
  const config = createAirSpringTesterConfig({
    units: { millimetresPerWorldUnit: '1000' },
    turntable: { speedRpm: 0 },
    cameras: {
      count: 8,
      travelMm: Number.POSITIVE_INFINITY,
      verticalSpeedMmPerSecond: -10,
    },
  }, (message) => warnings.push(message));

  assert.equal(config.units.millimetresPerWorldUnit, 1000);
  assert.equal(config.turntable.speedRpm, 0);
  assert.equal(config.cameras.count, 2);
  assert.equal(config.cameras.travelMm, 450);
  assert.equal(config.cameras.verticalSpeedMmPerSecond, 20);
  assert.equal(warnings.length, 4);
});
