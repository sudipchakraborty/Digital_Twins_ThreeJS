import test from 'node:test';
import assert from 'node:assert/strict';
import { ConveyorBelt, SixDofRobotArm, DobotMagician, UniversalRobot, RoboticCar, ProximitySensor } from '../../lib/index.js';
test('root library exports all robotics models',()=>{for(const value of [ConveyorBelt,SixDofRobotArm,DobotMagician,UniversalRobot,RoboticCar,ProximitySensor])assert.equal(typeof value,'function');});
