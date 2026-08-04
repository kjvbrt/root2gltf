/* This code combines different glTF exports into one document with correct cross-references.
 * This is because glTF indices are local to each export, so every index in source must be offset
 * by the current length of the corresponding array in target before appending.
 */

const mergeScenes = (target: any, source: any): any[] => {
  for (const scene of source.scenes) {
    // offset root node indices referenced by each scene
    if (scene.nodes) {
      scene.nodes = scene.nodes.map((n: number) => n + target.nodes.length);
    }
  }
  return [...target.scenes, ...source.scenes];
};

const mergeNodes = (target: any, source: any): any[] => {
  for (const node of source.nodes) {
    // offset mesh index referenced by each node
    if (node.mesh !== undefined) {
      node.mesh += target.meshes.length;
    }
    // offset child node indices referenced by each node
    if (node.children) {
      node.children = node.children.map((c: number) => c + target.nodes.length);
    }
  }
  return [...target.nodes, ...source.nodes];
};

const mergeMeshes = (target: any, source: any): any[] => {
  for (const mesh of source.meshes) {
    for (const prim of mesh.primitives) {
      // offset the material index referenced by each each primitive
      if (prim.material !== undefined) {
        prim.material += target.materials.length;
      }
      // offset the accessor index referenced by each primitive
      if (prim.indices !== undefined) {
        prim.indices += target.accessors.length;
      }
      // offset the vertex attribute accessor indices referenced by each primitive
      for (const key of Object.keys(prim.attributes)) {
        prim.attributes[key] += target.accessors.length;
      }
    }
  }
  return [...target.meshes, ...source.meshes];
};

const mergeAccessors = (target: any, source: any): any[] => {
  for (const acc of source.accessors) {
    // offset the bufferView index referenced by each accessor
    if (acc.bufferView !== undefined) {
      acc.bufferView += target.bufferViews.length;
    }
  }
  return [...target.accessors, ...source.accessors];
};

const mergeBufferViews = (target: any, source: any): any[] => {
  for (const bufferView of source.bufferViews) {
    // offset the buffer index referenced by each bufferView
    if (bufferView.buffer !== undefined) {
      bufferView.buffer += target.buffers.length;
    }
  }
  return [...target.bufferViews, ...source.bufferViews];
};

const mergeGLTF = (target: any, source: any): void => {
  for (const field of [
    "scenes",
    "nodes",
    "meshes",
    "accessors",
    "bufferViews",
    "materials",
    "buffers",
  ]) {
    target[field] ??= [];
    source[field] ??= [];
  }

  // glTF files have the following keys:

  // 1. asset: kept from target as-is

  // 2. scene: kept from target as-is

  // 3. scenes: cross-referenced and concatenated
  target.scenes = mergeScenes(target, source);

  // 4. nodes: cross-referenced and concatenated
  target.nodes = mergeNodes(target, source);

  // 5. meshes: cross-referenced and concatenated
  target.meshes = mergeMeshes(target, source);

  // 6. accessors: cross-referenced and concatenated
  target.accessors = mergeAccessors(target, source);

  // 7. bufferViews: cross-referenced and concatenated
  target.bufferViews = mergeBufferViews(target, source);

  // 8. materials: concatenated as-is
  target.materials = [...target.materials, ...source.materials];

  // 9. buffers: concatenated as-is
  target.buffers = [...target.buffers, ...source.buffers];
};

export default mergeGLTF;
