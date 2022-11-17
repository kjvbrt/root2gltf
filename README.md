# root2gltf

This app converts detector objects from ROOT format to glTF used by
[Phoenix](https://hepsoftwarefoundation.org/phoenix/).
It is a quick hack needed to run conversion headless (e.g. in CI).

Depends on JSROOT and Three.js.

Uses also patched versions of the `GLTFExporter.js` from Three.js and `phoenixExport.js` from
[root_cern-To_gltf-Exporter](https://github.com/HSF/root_cern-To_gltf-Exporter).


## Installation

After git clone run:
```
npm ci
```

## Usage

To run the app in the main directory:
```
node . detector.root
```

In order to convert the geometry one needs to write a configuration file.
The examples of the configuration file are provided in `configs` directory.
Three variables are expected in the configuration file:
  * `subParts` names of the detector subparts to be given separate element in
      the phoenix menu
  * `childrenToHide` stems of names of the subparts to be removed
  * `maxLevel` maximum depth of detail
