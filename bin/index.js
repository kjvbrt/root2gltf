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
    .usage("Usage: [-h] [-n <object-name>] -i <input-file>")
    .option("i", {alias: "input-file",
                  describe: "Input ROOT file",
                  type: "string",
                  demandOption: true})
    .option("o", {alias: "output-file",
                  describe: "Output ROOT file",
                  type: "string",
                  default: "fcc-detector.gltf"})
    .option("n", {alias: "name",
                  describe: "Object name",
                  type: "string",
                  default: "default"})
    .argv;


console.log("INFO: Reading file:");
console.log("      " + `${options.inputFile}`);


const inFile = await openFile(`${options.inputFile}`);

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
