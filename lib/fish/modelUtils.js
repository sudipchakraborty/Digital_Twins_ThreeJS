import * as THREE from 'three';

export function disposeGroup(group) {
  const geometries = new Set(); const materials = new Set();
  group.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); group.removeFromParent();
}
export function seededRandom(seed = 42) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
export function mesh(parent, geometry, material, position = [0, 0, 0]) {
  const value = new THREE.Mesh(geometry, material); value.position.set(...position);
  value.castShadow = true; value.receiveShadow = true; parent.add(value); return value;
}
export function beam(parent, from, to, radius, material) {
  const a = new THREE.Vector3(...from); const b = new THREE.Vector3(...to);
  const value = mesh(parent, new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), material);
  value.position.copy(a).add(b).multiplyScalar(0.5);
  value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()); return value;
}
