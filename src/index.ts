import { geoCfg } from "jsroot";
import { build } from "jsroot/geom";
import { Scene } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { findTrees, hideTree, pruneTree } from "./handleInput.js";
import {
  countGLTFObjects,
  deduplicateMaterials,
  deduplicateMeshes,
} from "./deduplicateOutput.js";
import mergeGLTF from "./concatenateOutput.js";

// Constants
import { GEO_GRAD_PER_SEGM } from "./lib/constants.js";

// Types
import type { TParams } from "./lib/types/converter.js";
import type { TGeoManager } from "./lib/types/root.js";
import type { TGLTFGeometry } from "./lib/types/gltf.js";

// Utils
import generateConfig from "./lib/utils/generateConfig.js";
import {
  installPolyfills,
  normalizePivot,
} from "./lib/utils/nodeWorkarounds.js";

// Polyfill FileReader for Node.js using the native Blob.arrayBuffer()
installPolyfills();

const root2gltf = async ({
  input,
  config = null,
}: TParams): Promise<TGLTFGeometry> => {
  try {
    // Read file detector geometry
    const rootGeo: TGeoManager = await input.readObject(input.fKeys[0].fName);
    if (!rootGeo) throw new Error("Failed to read detector geometry");

    // Read geometry parent node, root volume is shared by all the scenes
    const rootNode = rootGeo.fNodes.arr[0];
    if (!rootNode) throw new Error("Geometry has no parent node");

    // Read parent node subparts
    const childrenNodes = rootNode.fVolume.fNodes;
    if (!childrenNodes) throw new Error("Parent node has no subparts");

    const { hidden, depth, subparts } = generateConfig(config, childrenNodes);
    const exporter = new GLTFExporter();
    const [max, min] = [1, 0.4]; // Opacity limits
    const length = Object.keys(subparts).length - 1;

    let i = 0; // Current value to map
    let gltfGeo: TGLTFGeometry | null = null;

    // Filter out all nodes within hidden paths and beyond a maximum level
    pruneTree(rootNode, new Set(hidden), depth);

    // Set number of degrees per face for circles
    geoCfg("GradPerSegm", GEO_GRAD_PER_SEGM);

    for (const [key, values] of Object.entries(subparts)) {
      const rootScene = new Scene(); // Use one scene per config subpart
      const sceneOptions = {
        // vislevel: 4, // guardrail on the depth of the geometry hierarchy to traverse and render
        // numnodes: 1000, // guardrail on the total number of visible nodes across the whole scene
        numfaces: 1000, // (default 10000) guardrail on the total number of triangle faces across the whole scene
        // dflt_colors: false, // avoids overriding predefined colors
        // no_screen: false, // ignores kVisOnScreen visibility bits when set
        // composite: false, // unfolds composite shapes into separate parts
        // showtop: false, // renders the top/master volume (TGeoManager only)
        // instancing: -1, // -1 disables InstancedMesh, 1 forces it, 0 lets jsroot decide
        // frustum: null, // camera frustum used for LOD culling (irrelevant when rendering headless)
        // material_kind: "lambert", // three.js material used for generated meshes
        // set_names: true, // attaches volume names to generated meshes
      };

      hideTree(rootNode); // Reset the volume by hiding all subparts shown in the previous iteration
      findTrees(rootNode, new Set(values)); // Find and show all subparts corresponding to the current iteration

      rootScene.name = key;
      rootScene.children.push(build(rootGeo, sceneOptions)); // Build from reassigned parameters
      rootScene.userData.visible = true;
      rootScene.userData.opacity = ((length - i) * (max - min)) / length + min; // Dynamic transparency

      normalizePivot(rootScene); // Normalize pivot to null before exporting for Three.js GLTFExporter

      console.log(
        `INFO: ${key} has ${countGLTFObjects(rootScene.children[rootScene.children.length - 1])} objects`,
      );

      // Build one scene at a time so each graph is freed instead of accumulating in memory.
      const gltfScene = (await new Promise<unknown>((resolve, reject) => {
        exporter.parse(rootScene, resolve, reject);
      })) as TGLTFGeometry;

      if (!gltfGeo) gltfGeo = gltfScene;
      else mergeGLTF(gltfGeo, gltfScene);

      i++;
    }

    // Reduce the output file size by removing redundant data that jsroot generates
    deduplicateMaterials(gltfGeo!);
    deduplicateMeshes(gltfGeo!);

    return gltfGeo!;
  } catch (error) {
    throw new Error("Failed to convert ROOT file to glTF", {
      cause: error,
    });
  }
};

export default root2gltf;
