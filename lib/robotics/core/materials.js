import * as THREE from 'three';
export const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.15, ...options });
export const darkMaterial = () => material(0x20252b, { metalness: 0.65, roughness: 0.35 });
