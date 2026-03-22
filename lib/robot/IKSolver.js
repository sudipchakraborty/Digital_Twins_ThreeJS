// lib/robot/IKSolver.js
import * as THREE from 'three';

export class IKSolver {
  constructor(robot) {
    this.robot = robot;
  }

  solve(target) {
    const { joint1, joint2, joint3 } = this.robot;

    const x = target.x;
    const y = target.y;
    const z = target.z;

    // =========================
    // 1. Base rotation (J1)
    // =========================
    const theta1 = Math.atan2(x, z);
    joint1.setAngle(theta1);

    // =========================
    // 2. Planar IK (J2 & J3)
    // =========================
    const L1 = 1.5; // same as Joint2 link
    const L2 = 1.2; // same as Joint3 link

    const r = Math.sqrt(x * x + z * z);
    const h = y;

    const D = (r * r + h * h - L1 * L1 - L2 * L2) / (2 * L1 * L2);

    // Clamp to avoid NaN
    const D_clamped = Math.max(-1, Math.min(1, D));

    const theta3 = Math.acos(D_clamped);

    const theta2 =
      Math.atan2(h, r) -
      Math.atan2(L2 * Math.sin(theta3), L1 + L2 * Math.cos(theta3));

    joint2.setAngle(theta2);
    joint3.setAngle(theta3);
  }
}