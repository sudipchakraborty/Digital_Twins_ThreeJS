import test from 'node:test';
import assert from 'node:assert/strict';
import { positive, vector3, RoboticsModel } from '../../lib/robotics/core/RoboticsModel.js';
test('core validates dimensions and vectors', () => { assert.equal(positive(2, 'size'), 2); assert.throws(() => positive(0, 'size'), RangeError); assert.deepEqual(vector3([1, 2, 3], 'position').toArray(), [1, 2, 3]); });
test('base model disposal is idempotent', () => { const model = new RoboticsModel('Test'); model.dispose(); model.dispose(); assert.equal(model.getStatus().disposed, true); });
