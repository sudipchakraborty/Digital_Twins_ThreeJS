import * as THREE from 'three';

export function positive(value, name) { if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite`); return value; }
export function finite(value, name) { if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`); return value; }
export function vector3(value, name = 'value') { if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new RangeError(`${name} must contain three finite values`); return new THREE.Vector3(...value); }
export class RoboticsModel { constructor(name) { this.group = new THREE.Group(); this.group.name = name; this.disposed = false; } getStatus() { return { name: this.group.name, disposed: this.disposed }; } dispose() { if (this.disposed) return; this.disposed = true; this.group.clear(); } }
