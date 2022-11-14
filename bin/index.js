#!/usr/bin/env node

// Command line options
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

// Three
// import {Blob} from 'node:buffer';
// import * as THREE from 'three';
// import { GLTFExporter } from './GLTFExporter.js';

// GLTF exporter
import { convertGeometry } from './phoenixExport.js';

// Node
import * as fs from "fs";
import * as path from "path";


const options = yargs(hideBin(process.argv))
    .usage("Usage: [-h] [-n <object-name>] [-o <output-file>] [-c <config-file>] <input-file>")
    .positional("input-file", {describe: "Input ROOT file",
                               type: "string"})
    .option("o", {alias: "output-file",
                  describe: "Name of output glTF file",
                  type: "string"})
    .option("n", {alias: "object-name",
                  describe: "Object name",
                  type: "string",
                  default: "default"})
    .option("c", {alias: "config",
                  describe: "Configuration file for the detector",
                  type: "string",
                  default: "config.json"})
    .help("h")
    .argv;

if (!options._[0]) {
    console.log("ERROR: Input ROOT file not provided!")
    process.exit(1);
}

let configFilePath = "config.json";
if (options.config) {
  configFilePath = options.config;
}
console.log("INFO: Using this configuration file:");
console.log("      " + configFilePath);
const config = JSON.parse(fs.readFileSync(configFilePath));

const inFilePath = `${options._[0]}`;
console.log("INFO: Reading file:");
console.log("      " + inFilePath);

let outFileName = path.parse(inFilePath).name + '.gltf';
if (options.outputFile) {
  outFileName = options.outputFile;
}

convertGeometry(inFilePath,
                outFileName,
                config.maxLevel,
                config.subParts,
                config.childrenToHide,
                options.objectName);
