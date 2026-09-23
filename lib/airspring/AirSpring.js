import * as THREE from 'three';
import { disposeObject3D } from './dispose.js';
import { mmToWorld } from './config.js';

const RUBBER = 0x111315;
const RUBBER_RIB = 0x202326;
const STEEL = 0xb7bec5;
const DARK_STEEL = 0x4d555d;

export class AirSpring {
  constructor(dimensions, config) {
    this.group = new THREE.Group();
    this.group.name = 'AirSpring';
    this.group.userData = {
      component: 'air-spring',
      bellowsCount: 2,
      dimensionsMm: { ...dimensions },
    };
    this.disposed = false;

    const diameter = mmToWorld(dimensions.outerDiameterMm, config);
    const plateDiameter = mmToWorld(dimensions.innerDiameterMm, config);
    const height = mmToWorld(dimensions.heightMm, config);
    const radius = diameter / 2;
    const plateRadius = plateDiameter / 2;
    const plateThickness = Math.min(height * 0.055, 0.014);

    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: RUBBER,
      roughness: 0.88,
      metalness: 0.02,
    });
    const ribMaterial = new THREE.MeshStandardMaterial({
      color: RUBBER_RIB,
      roughness: 0.76,
      metalness: 0.02,
    });
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: STEEL,
      roughness: 0.3,
      metalness: 0.82,
    });
    const darkSteelMaterial = new THREE.MeshStandardMaterial({
      color: DARK_STEEL,
      roughness: 0.32,
      metalness: 0.75,
    });

    const bodyStart = plateThickness * 0.75;
    const bodyEnd = height - plateThickness * 0.75;
    const profile = [];
    const segments = 56;

    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const lobe = Math.abs(Math.sin(t * Math.PI * 2));
      const crown = Math.pow(lobe, 0.58);
      const endTaper = Math.pow(Math.sin(t * Math.PI), 0.24);
      const profileRadius = plateRadius * 0.88
        + (radius - plateRadius * 0.88) * crown * endTaper;
      profile.push(new THREE.Vector2(profileRadius, bodyStart + t * (bodyEnd - bodyStart)));
    }

    const body = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 96),
      rubberMaterial,
    );
    body.name = 'RubberBellows';
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    const ribRadius = Math.max(0.0012, diameter * 0.006);
    const ribLevels = [0.12, 0.2, 0.31, 0.42, 0.58, 0.69, 0.8, 0.88];
    ribLevels.forEach((fraction, index) => {
      const lobe = Math.abs(Math.sin(fraction * Math.PI * 2));
      const crown = Math.pow(lobe, 0.58);
      const endTaper = Math.pow(Math.sin(fraction * Math.PI), 0.24);
      const ringRadius = plateRadius * 0.88
        + (radius - plateRadius * 0.88) * crown * endTaper;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius + ribRadius * 0.35, ribRadius, 8, 64),
        ribMaterial,
      );
      rib.name = `CircumferentialRib${index + 1}`;
      rib.rotation.x = Math.PI / 2;
      rib.position.y = bodyStart + fraction * (bodyEnd - bodyStart);
      rib.castShadow = true;
      this.group.add(rib);
    });

    for (let index = 0; index < 18; index += 1) {
      const angle = index / 18 * Math.PI * 2;
      const points = [];
      for (let step = 0; step <= 20; step += 1) {
        const t = step / 20;
        const lobe = Math.abs(Math.sin(t * Math.PI * 2));
        const crown = Math.pow(lobe, 0.58);
        const endTaper = Math.pow(Math.sin(t * Math.PI), 0.24);
        const r = plateRadius * 0.88
          + (radius - plateRadius * 0.88) * crown * endTaper
          + ribRadius * 0.2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          bodyStart + t * (bodyEnd - bodyStart),
          Math.sin(angle) * r,
        ));
      }
      const rib = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, ribRadius * 0.48, 5, false),
        ribMaterial,
      );
      rib.name = `VerticalRib${index + 1}`;
      rib.castShadow = true;
      this.group.add(rib);
    }

    const plateGeometry = new THREE.CylinderGeometry(
      plateRadius,
      plateRadius * 1.04,
      plateThickness,
      64,
      1,
      false,
    );

    const bottomPlate = new THREE.Mesh(plateGeometry, darkSteelMaterial);
    bottomPlate.name = 'BottomMountingPlate';
    bottomPlate.position.y = plateThickness / 2;
    bottomPlate.castShadow = true;
    bottomPlate.receiveShadow = true;
    this.group.add(bottomPlate);

    const topPlate = new THREE.Mesh(plateGeometry.clone(), steelMaterial);
    topPlate.name = 'TopMountingPlate';
    topPlate.position.y = height - plateThickness / 2;
    topPlate.castShadow = true;
    topPlate.receiveShadow = true;
    this.group.add(topPlate);

    const fittingHeight = plateThickness * 0.35;
    const fitting = new THREE.Mesh(
      new THREE.CylinderGeometry(plateRadius * 0.15, plateRadius * 0.19, fittingHeight, 32),
      darkSteelMaterial,
    );
    fitting.name = 'AirFitting';
    fitting.position.y = height - fittingHeight / 2;
    this.group.add(fitting);

    const fittingBore = new THREE.Mesh(
      new THREE.CylinderGeometry(plateRadius * 0.065, plateRadius * 0.065, fittingHeight * 1.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x14191d, roughness: 0.4, metalness: 0.7 }),
    );
    fittingBore.name = 'AirFittingBore';
    fittingBore.position.y = height - fittingHeight / 2;
    this.group.add(fittingBore);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject3D(this.group);
    this.group.clear();
  }
}
