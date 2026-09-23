import * as THREE from 'three';
import { disposeObject3D } from './dispose.js';

export class LeadScrewAxis {
  constructor({ travelWorld, lowerWorld = 0, side = 1 }) {
    this.group = new THREE.Group();
    this.group.name = side < 0 ? 'LeadScrewAxisLeft' : 'LeadScrewAxisRight';
    this.group.userData.component = 'lead-screw-axis';
    this.carriage = new THREE.Group();
    this.carriage.name = 'CameraCarriage';
    this.travelWorld = travelWorld;
    this.lowerWorld = lowerWorld;
    this.lastPosition = 0;
    this.disposed = false;

    const totalHeight = travelWorld + 0.13;
    const railSpacing = 0.07;
    const steel = new THREE.MeshStandardMaterial({
      color: 0x9ca7af,
      roughness: 0.28,
      metalness: 0.84,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x303840,
      roughness: 0.45,
      metalness: 0.68,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: 0x1e7f98,
      roughness: 0.42,
      metalness: 0.58,
    });

    [-railSpacing / 2, railSpacing / 2].forEach((z, index) => {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, totalHeight, 16),
        steel,
      );
      rail.name = `GuideRail${index + 1}`;
      rail.position.set(0, lowerWorld + totalHeight / 2, z);
      rail.castShadow = true;
      this.group.add(rail);
    });

    this.screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, totalHeight, 20),
      dark,
    );
    this.screw.name = 'LeadScrew';
    this.screw.position.set(0, lowerWorld + totalHeight / 2, 0);
    this.group.add(this.screw);

    const turns = 28;
    const helixPoints = [];
    for (let index = 0; index <= turns * 8; index += 1) {
      const t = index / (turns * 8);
      const angle = t * turns * Math.PI * 2;
      helixPoints.push(new THREE.Vector3(
        Math.cos(angle) * 0.0091,
        lowerWorld + t * totalHeight,
        Math.sin(angle) * 0.0091,
      ));
    }
    const thread = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints), turns * 8, 0.0008, 4, false),
      steel,
    );
    thread.name = 'LeadScrewThread';
    this.screw.add(thread);
    thread.position.y = -(lowerWorld + totalHeight / 2);

    [lowerWorld - 0.018, lowerWorld + totalHeight + 0.018].forEach((y, index) => {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.035, 0.1),
        dark,
      );
      block.name = index === 0 ? 'LowerBearingBlock' : 'UpperBearingBlock';
      block.position.y = y;
      block.castShadow = true;
      this.group.add(block);
    });

    const carriageBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.07, 0.12),
      accent,
    );
    carriageBody.name = 'CarriageBody';
    carriageBody.castShadow = true;
    this.carriage.add(carriageBody);
    this.group.add(this.carriage);
    this.setTravelPosition(travelWorld);
  }

  setTravelPosition(worldUnits) {
    const position = Math.min(this.travelWorld, Math.max(0, worldUnits));
    const delta = position - this.lastPosition;
    this.lastPosition = position;
    this.carriage.position.y = this.lowerWorld + position;
    this.screw.rotation.y += delta * 180;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject3D(this.group);
    this.group.clear();
  }
}
