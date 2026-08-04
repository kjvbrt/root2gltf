import { DEPTH } from "../constants.js";
import type { TConfig } from "../types/converter.js";
import type { TObjArray } from "../types/root.js";

const generateConfig = (config: TConfig | null, childrenNodes: TObjArray) => {
  if (config !== null) return config;

  console.log(
    `INFO: Exporting the full geometry at the default traversal depth ${DEPTH}. Use a config when you need to:
    - Hide parts: exclude specific volumes from the output
    - Group volumes: combine multiple volumes into a single named view
    - Increase depth: traverse deeper into the geometry tree for detail`,
  );

  return {
    hidden: [],
    subparts: Object.fromEntries(
      childrenNodes.arr.map((node) => [node.fName, [node.fName]]),
    ),
    depth: DEPTH,
  };
};

export default generateConfig;
