#!/usr/bin/env python
# coding: utf-8

from dd4hep import Detector
import re
from argparse import ArgumentParser
import pprint
import json

parser = ArgumentParser()

parser.add_argument(
    "--compact", help="DD4hep compact description xml", required=True
)
parser.add_argument(
    "--max_depth",
    help="Maximum traversal depth of the detector tree",
    default=10,
    type=int,
)
parser.add_argument(
    "--config_path",
    help="Location of produced config file",
    default='nothing',
    type=str,
)

args = parser.parse_args()
theDetector = Detector.getInstance()
theDetector.fromXML(args.compact)
start = theDetector.world()

def process_name(raw_name):
    name = re.sub(r"\d+", ".*", raw_name)
    return name

def tree(detElement, depth, maxDepth):
    nd = {}
    depth += 1
    children = detElement.children()
    for raw_name, child in children:
        if depth > maxDepth:
            tree(child, depth, maxDepth)
        else:
            dictionary = tree(child, depth, maxDepth)
            nd.update({raw_name: dictionary})
    return nd


def post_processing(obj, main_parts, subParts={}, sublist= []):
    for k, v in obj.items():
        if k in main_parts:
            #remove envelopes from being featured in the final geometry
            sublist = [f'{k}_(?!envelope)\\w+']  
            outer_list = []
            outer_list.append(sublist)
            outer_list.append(0.8)
            subParts.update({str(k): outer_list})
            post_processing(v, main_parts, subParts, sublist)
                
        else:
            k_new = process_name(f"{k}")
            x = re.search("module|stave|layer|Calorimeter", k_new)
            if k_new not in sublist and x == None:
                sublist.append(k_new)
            post_processing(v, main_parts, subParts, sublist)
    return subParts
            
detector_dict = tree(start, 0, args.max_depth)
subPart_processed = post_processing(detector_dict, list(detector_dict.keys()))

final_dict = {"childrenToHide": [],
              "subParts": subPart_processed,
              "maxLevel": 3}

pprint.pprint(final_dict)
with open(args.config_path, "w") as outfile: 
    json.dump(final_dict, outfile, indent=4)