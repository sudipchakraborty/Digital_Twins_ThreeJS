import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advancePingPong,
  rpmToRadiansPerSecond,
} from '../../lib/airspring/motion.js';

test('converts two RPM to radians per second', () => {
  assert.equal(rpmToRadiansPerSecond(2), Math.PI / 15);
});

test('reflects travel overshoot at the upper limit', () => {
  const result = advancePingPong(
    { position: 9, direction: 1 },
    4,
    0,
    10,
    1,
  );

  assert.equal(result.position, 7);
  assert.equal(result.direction, -1);
});

test('reflects large travel deltas across both limits', () => {
  const result = advancePingPong(
    { position: 2, direction: -1 },
    37,
    0,
    10,
    1,
  );

  assert.equal(result.position, 5);
  assert.equal(result.direction, -1);
});

test('keeps position unchanged when speed or elapsed time is zero', () => {
  assert.deepEqual(
    advancePingPong({ position: 4, direction: 1 }, 0, 0, 10, 5),
    { position: 4, direction: 1 },
  );
  assert.deepEqual(
    advancePingPong({ position: 4, direction: -1 }, 3, 0, 10, 0),
    { position: 4, direction: -1 },
  );
});
