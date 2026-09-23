import test from 'node:test';
import assert from 'node:assert/strict';
import { AirSpringTester } from '../../lib/airspring/AirSpringTester.js';

test('assembles the machine and emits deterministic capture metadata', () => {
  const captures = [];
  const tester = new AirSpringTester({
    inspection: { captureAngleStepDegrees: 30 },
    onCapture: (capture) => captures.push(capture),
  });

  tester.start();
  tester.update(5);

  assert.equal(tester.group.userData.component, 'air-spring-tester');
  assert.equal(captures.length, 4);
  assert.equal(new Set(captures.map((item) => item.cameraId)).size, 2);
  assert.ok(captures.every((item) => Number.isFinite(item.heightMm)));
  assert.deepEqual(
    captures.map((item) => item.sampleId),
    ['SCAN-000001-CAM-1', 'SCAN-000001-CAM-2', 'SCAN-000002-CAM-1', 'SCAN-000002-CAM-2'],
  );
});

test('does not move or emit captures while stopped', () => {
  const captures = [];
  const tester = new AirSpringTester({ onCapture: (capture) => captures.push(capture) });

  tester.update(20);
  const status = tester.getStatus();

  assert.equal(status.running, false);
  assert.equal(status.angleRadians, 0);
  assert.equal(status.cameraHeightMm, 450);
  assert.equal(captures.length, 0);
});

test('accepts speed controls, invalid callbacks, and repeated disposal', () => {
  const tester = new AirSpringTester({ onCapture: 'not-a-function' });

  tester.setTurntableSpeed(4);
  tester.setCameraSpeed(40);
  tester.start();
  tester.update(1);

  const status = tester.getStatus();
  assert.equal(status.turntableSpeedRpm, 4);
  assert.equal(status.cameraSpeedMmPerSecond, 40);
  assert.equal(status.cameraHeightMm, 410);
  assert.doesNotThrow(() => {
    tester.dispose();
    tester.dispose();
  });
});
