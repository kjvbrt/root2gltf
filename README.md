# root2gltf

[![Node.js Package](https://github.com/HEP-FCC/root2gltf/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/HEP-FCC/root2gltf/actions/workflows/npm-publish.yml)

Converts particle physics detector geometries from ROOT files to the glTF format used by [Phoenix](https://github.com/HSF/phoenix).

It reads a ROOT geometry file, deduplicates redundant mesh and material data, and writes out a single `.gltf` file ready to load in Phoenix. An optional config file can be used to hide specific parts, group volumes into named views, or control traversal depth.

This project is based on [root_cern-To_gltf-Exporter](https://github.com/HSF/root_cern-To_gltf-Exporter), a browser-based ROOT to glTF converter developed by [Sebastien Ponce](https://github.com/sponce).

## Usage

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### CLI

```bash
node bin/cli.js -i <input.root> [-c <config.json>] [-o <output.gltf>]
```

| Flag                  | Description                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| `-i`, `--input-file`  | Required path to the input ROOT file                                           |
| `-c`, `--config-file` | Optional path to a detector config file                                        |
| `-o`, `--output-file` | Optional path for the output glTF file (which defaults to `<input-name>.gltf`) |

Example with a config:

```bash
node bin/cli.js -i CLD_o4_v05.root -c CLD_o4_v05.config.json -o CLD.gltf
```

Examples without a config:

```bash
node bin/cli.js -i CLD_o4_v05.root -o CLD_o4_v05.gltf
node bin/cli.js -i ALLEGRO_o2_v01.root -o ALLEGRO_o2_v01.gltf
node --max-old-space-size=4096 bin/cli.js -i IDEA_o1_v03.root -o IDEA_o1_v03.gltf
node bin/cli.js -i ILD_FCCee_v02.root -o ILD_FCCee_v02.gltf
```

### API

You can also call the converter in code. File I/O is your responsibility — pass an already-opened ROOT file and an optional config object:

Example with a config:

```ts
import { writeFile } from "node:fs/promises";
import { openFile } from "jsroot";
import root2gltf from "root2gltf";

const input = await openFile("CLD_o4_v05.root");

const gltfContent = await root2gltf({
  input,
  config: {
    childrenToHide: ["BeamPipeShield_assembly_0"],
    depth: 4,
    children: { "Beam Pipe": ["BeBeampipe_assembly_0"] },
  },
});

await writeFile("CLD.gltf", JSON.stringify(gltfContent), "utf8");
```

## Config file

Config file/object is optional. Without it, the converter exports the full geometry at the default traversal depth 2. Use a config when you need to:

- **Hide parts:** exclude specific volumes from the output
- **Group volumes:** combine multiple volumes into a single named view
- **Increase depth:** traverse deeper into the geometry tree for more detail

Here is what the fields do:

| Field            | Description                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `depth`          | How many levels deep to traverse the geometry tree. Higher values produce more detail but larger files. |
| `childrenToHide` | List of node names to remove before processing.                                                         |
| `children`       | Maps a display name to a list of volume names. Each entry becomes a separate scene in the glTF file.    |

Ready-to-use configs for several FCC-ee detector concepts are in [configs/](configs/).

### Example: Allegro_o2_v01

```json
{
  "childrenToHide": [],
  "children": {
    "Beam Pipe": [
      "BeBeampipe_assembly_0",
      "BeamPipe_assembly_1",
      "SynchRadMask_assembly_2",
      "BeamPipeShield_assembly_3",
      "BeamPipeShield_noRot_assembly_4"
    ],
    "Screen Solenoid": ["CompSol_assembly_5", "ScreenSol_assembly_6"],
    "LumiCal": [
      "LumiCal_envelope_7",
      "LumiCalInstrumentation_envelope_8",
      "LumiCalCooling_envelope_9",
      "LumiCalBackShield_envelope_10"
    ],
    "Vertex": ["Vertex_11"],
    "STT": ["STT_o1_v01_envelope_12"],
    "Silicon Wrapper": ["SiWrB_envelope_13", "SiWrD_envelope_14"],
    "ECal": ["ECalBarrel_vol_15"],
    "HCal": ["HCalEnvelopeVolume_16"],
    "ECal Endcap": ["ECalEndcaps_turbine_17"],
    "HCal Endcap": ["HCalThreePartsEndcap_volume_18"],
    "Endcap": ["Barrel_assembly_19", "Endcaps_assembly_20"]
  },
  "depth": 3
}
```

## Project structure

```
root2gltf/
├── bin/
│   └── cli.js                    # CLI entry point (argument parsing)
├── src/
│   ├── index.ts                  # Main conversion logic
│   ├── handleInput.ts            # ROOT tree traversal and filtering helpers
│   ├── deduplicateOutput.ts      # glTF deduplication (materials and meshes)
│   ├── concatenateOutput.ts      # Merges per-scene glTF exports into a single object
│   └── lib/
│       ├── constants.ts          # Build options and geometry settings
│       ├── utils/
│       │   ├── generateConfig.ts # Config generation from ROOT children nodes
│       │   └── nodeWorkarounds.ts# Node.js polyfills and workarounds
│       └── types/                # TypeScript type definitions
└── dist/                         # Compiled JavaScript output (generated by tsc)
```

## Performance improvements

Memory

- Export one scene at a time so each graph is freed instead of accumulating in memory
- Keep a reference to the first occurrence of each object instead of JSON-parsing during deduplication
- Deload Node.js call stack by turning recursive functions into iterative (which uses the heap)
