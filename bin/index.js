#!/usr/bin/env node

// Command line options
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

// JSROOT
// import {openFile} from "jsroot";
// import {geoCfg, build} from "jsroot/geom";

// Three
import {Blob} from 'node:buffer';
import * as THREE from 'three';
// import { GLTFExporter } from './GLTFExporter.js';

// GLTF exporter
import { convertGeometry } from './phoenixExport.js';

// Node
import * as fs from "fs";
import * as path from "path";


const options = yargs(hideBin(process.argv))
    .usage("Usage: [-h] [-n <object-name>] [-o <output-file>] <input-file>")
    .positional("input-file", {describe: "Input ROOT file",
                               type: "string"})
    .option("o", {alias: "output-file",
                  describe: "Name of output glTF file",
                  type: "string"})
    .option("n", {alias: "object-name",
                  describe: "Object name",
                  type: "string",
                  default: "default"})
    .argv;

if (!options._[0]) {
    console.log("ERROR: Input ROOT file not provided!")
    process.exit(1);
}


const inFilePath = `${options._[0]}`;
console.log("INFO: Reading file:");
console.log("      " + inFilePath);

let outFileName = path.parse(inFilePath).name + '.gltf';
if (options.outputFile) {
  outFileName = options.outputFile;
}

/*
const inFile = await openFile(inFilePath);

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

        console.log("INFO: Result saved to: '" + outFileName);
    })
});
*/

let hide_children = [

      "passive_",
      "active_",
      "PCB_"

];

let subparts = {
        "Cryo > Front" : [["ECAL_Cryo_front_0"], .8],
        "Cryo > Back" : [["ECAL_Cryo_back_1"], .8],
        "Cryo > Sides" : [["ECAL_Cryo_side_2"], .8],
        "Services > _Front" : [["services_front_3"], .6],
        "Services > _Back" : [["services_back_4"], .6],
        "Bath": [["LAr_bath_5"], true]
}

convertGeometry(inFilePath,
                outFileName,
                4,
                subparts,
                hide_children,
                options.objectName);
