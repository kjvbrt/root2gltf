import { K_VIS_DAUGHTER, K_VIS_ON_SCREEN } from "./lib/constants.js";
import type { TGeoNodeMatrix, TGeoVolume } from "./lib/types/root.js";
import {
  areDimensionsEqual,
  arePositionsEqual,
  reshapeSphere,
  shrinkShape,
} from "./lib/utils/optimizeGraphics.js";

// Filter out all volume subparts within the hidden paths and beyond a maximum level
export const pruneTree = (
  node: TGeoNodeMatrix,
  hiddenPaths: Set<string>,
  maxLevel: number,
): void => {
  const stack: { node: TGeoNodeMatrix; level: number }[] = [{ node, level: 0 }];

  while (stack.length) {
    const { node: current, level } = stack.pop()!;

    if (current.fVolume.fNodes) {
      const nodes = current.fVolume.fNodes.arr;
      let j = 0;

      nodes.forEach((n) => {
        if (level < maxLevel && !hiddenPaths.has(n.fName)) nodes[j++] = n;
      });

      nodes.length = j;

      nodes.forEach((n) => stack.push({ node: n, level: level + 1 }));
    }
  }
};

// Makes given node and all its children invisible
export const hideTree = (node: TGeoNodeMatrix): void => {
  const stack: TGeoNodeMatrix[] = [node];

  while (stack.length) {
    const current = stack.pop()!;

    current.fVolume.fGeoAtt &= ~K_VIS_ON_SCREEN; // Clears node visibility flag

    if (current.fVolume.fNodes) stack.push(...current.fVolume.fNodes.arr);
  }
};

// Makes given node and all its children visible
const showTree = (node: TGeoNodeMatrix): void => {
  const stack: { node: TGeoNodeMatrix; parent: TGeoVolume | null }[] = [
    { node, parent: null },
  ];

  while (stack.length) {
    const { node: current, parent } = stack.pop()!;

    current.fVolume.fGeoAtt |= K_VIS_ON_SCREEN;

    // Shrink shape if volume overlaps with the parewnt
    if (
      parent !== null &&
      arePositionsEqual(current.fMatrix) &&
      areDimensionsEqual(parent.fShape, current.fVolume.fShape) &&
      current.fVolume.fShape
    )
      shrinkShape(current.fVolume.fShape);

    // Reshape sphere if
    reshapeSphere(current.fVolume.fShape);

    if (current.fVolume.fNodes) {
      stack.push(
        ...current.fVolume.fNodes.arr.map((n) => ({
          node: n,
          parent: current.fVolume,
        })),
      );
    }
  }
};

// Find and show all volume subparts within the target paths
export const findTrees = (
  node: TGeoNodeMatrix,
  paths: Set<string>,
): boolean => {
  if (!node.fVolume.fNodes) return false;

  let isFound = false;

  node.fVolume.fNodes.arr.forEach((n) => {
    if (paths.has(n.fName)) {
      // Make given node and all its children visible
      showTree(n);
      isFound = true;
    } else if (findTrees(n, paths)) {
      // Make children visible but not the given node
      n.fVolume.fGeoAtt |= K_VIS_DAUGHTER;
      isFound = true;
    }
  });

  return isFound;
};
