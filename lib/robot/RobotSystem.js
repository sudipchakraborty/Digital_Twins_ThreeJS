import {
  RobotBase,
  Joint1,
  Joint2,
  Joint3,
  Joint4,
  Joint5,
  Joint6,
  IKSolver
} from '../index.js';

export class RobotSystem {
  constructor(scene) {
    // Build robot
    this.base = new RobotBase(scene);
    this.joint1 = new Joint1(this.base.mesh);
    this.joint2 = new Joint2(this.joint1.group);
    this.joint3 = new Joint3(this.joint2.end);
    this.joint4 = new Joint4(this.joint3.end);
    this.joint5 = new Joint5(this.joint4.end);
    this.joint6 = new Joint6(this.joint5.group);

    // IK
    this.ik = new IKSolver(this);
  }

  update(target) {
    this.ik.solve(target);
    this.joint4.update();
    this.joint5.update();
    this.joint6.update();
  }
}