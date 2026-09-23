export function disposeObject3D(root) {
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();

  root.traverse((object) => {
    if (object.geometry && !disposedGeometries.has(object.geometry)) {
      object.geometry.dispose();
      disposedGeometries.add(object.geometry);
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.filter(Boolean).forEach((material) => {
      if (!disposedMaterials.has(material)) {
        material.dispose();
        disposedMaterials.add(material);
      }
    });
  });
}
