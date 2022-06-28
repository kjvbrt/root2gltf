#!/usr/bin/env node

// Command line options
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

// JSROOT
import {openFile} from "jsroot";
import {build} from "jsroot/geom";

// Three
import {Blob} from 'node:buffer';
import * as THREE from 'three';
import { GLTFExporter } from './GLTFExporter.js';

// FS
import * as fs from "fs";


const options = yargs(hideBin(process.argv))
    .usage("Usage: [-h] [-n <object-name>] [-o <output-file>] <input-file>")
    .positional("input-file", {describe: "Input ROOT file",
                               type: "string"})
    .option("o", {alias: "output-file",
                  describe: "Output ROOT file",
                  type: "string",
                  default: "detector.gltf"})
    .option("n", {alias: "name",
                  describe: "Object name",
                  type: "string",
                  default: "default"})
    .argv;

if (!options._[0]) {
    console.log("ERROR: Input ROOT file not provided!")
    process.exit(1);
}


console.log("INFO: Reading file:");
console.log("      " + `${options._[0]}`);


const inFile = await openFile(`${options._[0]}`);

let obj;
try {
    obj = await inFile.readObject(`${options.name}`);
} catch (err) {
    if (err.message.includes("Key not found")) {
        console.log("ERROR: Provided object name '" +
                    `${options.name}` + "' not found!")
        process.exit(1);
    } else {
        throw err;
    }
}

let objOpt = {numfaces:100000};
const obj3d = build(obj, objOpt);

const exporter = new GLTFExporter();

exporter.parse(obj3d, function(gltf) {
  // console.log(JSON.stringify(gltf));
    fs.writeFile(`${options.outputFile}`, JSON.stringify(gltf), 'utf8', function (err) {
        if (err) {
            console.log("ERROR: File can't be saved!");
            return console.log(err);
            process.exit(1);
        }

        console.log("INFO: Result saved to: '" + `${options.outputFile}`);
    })
});
