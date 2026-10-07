import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ConveyorBelt, SixDofRobotArm, DobotMagician, UniversalRobot, RoboticCar, ProximitySensor } from '../../lib/robotics/index.js';
test('conveyor moves registered products while running',()=>{const c=new ConveyorBelt({length:4,speed:1});const p=new THREE.Object3D();c.addProduct(p,0);c.start();c.update(1);assert.equal(p.position.x,1);assert.equal(c.getStatus().productCount,1);c.dispose();});
test('six dof arm clamps angles and rejects distant targets',()=>{const a=new SixDofRobotArm();assert.equal(a.setJointAngles([999,0,0,0,0,0])[0],180);assert.equal(a.setEndEffectorTarget(new THREE.Vector3(9,0,0)).reachable,false);a.dispose();});
test('Dobot and Universal Robot expose six axis tool mounts',()=>{for(const Model of [DobotMagician,UniversalRobot]){const m=new Model();assert.equal(m.getStatus().jointCount,6);assert.equal(m.toolMount.isObject3D,true);m.dispose();}});
test('proximity sensor detects nearest object inside forward cone',()=>{const s=new ProximitySensor({range:3});const target=new THREE.Object3D();target.position.set(0,0,-1);const reading=s.detect([target]);assert.equal(reading.detected,true);assert.equal(reading.object,target);s.dispose();});
test('robotic car drives and mounts sensors',()=>{const c=new RoboticCar();const s=new ProximitySensor();c.addSensor(s);c.setDrive(2);c.update(0.5);assert.equal(c.getStatus().sensorCount,1);assert.equal(c.group.position.z,-1);c.dispose();});
