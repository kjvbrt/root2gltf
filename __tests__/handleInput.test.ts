import { describe, it, expect } from "@jest/globals";
import { pruneTree, hideTree, findTrees } from "../src/handleInput.js";
import { K_VIS_ON_SCREEN, K_VIS_DAUGHTER } from "../src/lib/constants.js";
import { makeNode } from "./mocks.js";

describe("pruneTree", () => {
  describe("given a node with children", () => {
    describe("when a child name is in the hidden set", () => {
      it("then removes it from the parent", () => {
        const child = makeNode("Hidden");
        const root = makeNode("Root", [child]);

        pruneTree(root, new Set(["Hidden"]), 3);
        expect(root.fVolume.fNodes!.arr).toHaveLength(0);
      });
    });

    describe("when a child is at or beyond maxLevel", () => {
      it("then removes its subtree", () => {
        const grandchild = makeNode("GC");
        const child = makeNode("Child", [grandchild]);
        const root = makeNode("Root", [child]);

        pruneTree(root, new Set(), 1);
        expect(root.fVolume.fNodes!.arr[0]!.fVolume.fNodes!.arr).toHaveLength(
          0,
        );
      });
    });

    describe("when no children are filtered", () => {
      it("then keeps them all", () => {
        const child = makeNode("Keep");
        const root = makeNode("Root", [child]);

        pruneTree(root, new Set(), 3);
        expect(root.fVolume.fNodes!.arr).toHaveLength(1);
      });
    });
  });

  describe("given a node with no children", () => {
    describe("when pruneTree is called", () => {
      it("then does nothing", () => {
        const root = makeNode("Root");

        expect(() => pruneTree(root, new Set(), 3)).not.toThrow();
      });
    });
  });
});

describe("hideTree", () => {
  describe("given a node with K_VIS_ON_SCREEN set", () => {
    describe("when hideTree is called", () => {
      it("then clears K_VIS_ON_SCREEN on the node", () => {
        const node = makeNode("A", [], K_VIS_ON_SCREEN);

        hideTree(node);
        expect(node.fVolume.fGeoAtt & K_VIS_ON_SCREEN).toBe(0);
      });

      it("then clears K_VIS_ON_SCREEN on all descendants", () => {
        const child = makeNode("B", [], K_VIS_ON_SCREEN);
        const root = makeNode("Root", [child], K_VIS_ON_SCREEN);

        hideTree(root);
        expect(root.fVolume.fGeoAtt & K_VIS_ON_SCREEN).toBe(0);
        expect(child.fVolume.fGeoAtt & K_VIS_ON_SCREEN).toBe(0);
      });
    });
  });
});

describe("findTrees", () => {
  describe("given a node with no children", () => {
    describe("when called with a target set", () => {
      it("then returns false", () => {
        const root = makeNode("Root");

        expect(findTrees(root, new Set(["X"]))).toBe(false);
      });
    });
  });

  describe("given a node whose children do not match the target paths", () => {
    describe("when called with those targets", () => {
      it("then returns false", () => {
        const root = makeNode("Root", [makeNode("A"), makeNode("B")]);

        expect(findTrees(root, new Set(["X"]))).toBe(false);
      });
    });
  });

  describe("given a direct child matching the target path", () => {
    describe("when findTrees is called", () => {
      it("then returns true and makes the child visible", () => {
        const child = makeNode("Target", [], 0, 1);
        const root = makeNode("Root", [child]);
        const found = findTrees(root, new Set(["Target"]));

        expect(found).toBe(true);
        expect(child.fVolume.fGeoAtt & K_VIS_ON_SCREEN).toBe(K_VIS_ON_SCREEN);
      });
    });
  });

  describe("given a descendant matching the target path", () => {
    describe("when findTrees is called", () => {
      it("then sets K_VIS_DAUGHTER on the intermediate parent", () => {
        const grandchild = makeNode("Target", [], 0, 1);
        const child = makeNode("Middle", [grandchild], 0);
        const root = makeNode("Root", [child]);

        findTrees(root, new Set(["Target"]));
        expect(child.fVolume.fGeoAtt & K_VIS_DAUGHTER).toBe(K_VIS_DAUGHTER);
      });
    });
  });
});
