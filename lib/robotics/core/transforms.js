import * as THREE from 'three';
export const box = (parent, size, mat, position = [0, 0, 0]) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat); mesh.position.set(...position); parent.add(mesh); return mesh; };
export const cylinder = (parent, radius, height, mat, position = [0, 0, 0], rotation = [0, 0, 0]) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), mat); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh; };
export const disposeGroup = group => { group.traverse(object => { object.geometry?.dispose?.(); if (Array.isArray(object.material)) object.material.forEach(item => item.dispose?.()); else object.material?.dispose?.(); }); group.clear(); };
