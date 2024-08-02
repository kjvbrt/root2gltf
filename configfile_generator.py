#!/usr/bin/env python
# coding: utf-8

from dd4hep import Detector
import re
from collections import Counter
from argparse import ArgumentParser
from collections import defaultdict
import pprint
import json

parser = ArgumentParser()

parser.add_argument(
    "--compactFile", help="DD4hep compact description xml", required=True
)
parser.add_argument(
    "--maxDepth",
    help="Maximum traversal depth of the detector tree",
    default=10,
    type=int,
)
parser.add_argument(
    "--maxEdges", help="Maximum number of edges per connection", default=5, type=int
)

args = parser.parse_args()

theDetector = Detector.getInstance()
theDetector.fromXML(args.compactFile)

# take part between last / and before the .xml
detector_name = args.compactFile.split("/")[-1].split(".")[0]

# start = theDetector.detector("OpenDataTracker")
start = theDetector.world()

def tree(detElement, depth, maxDepth):
    nd = {}
    depth += 1
    children = detElement.children()
    for raw_name, child in children:
        if depth > args.maxDepth:
            tree(child, depth, maxDepth)
        else:
            dictionary = tree(child, depth, maxDepth)
            nd.update({raw_name: dictionary})
    return nd

detector_dict = tree(start, 0, args.maxDepth)
#pprint.pprint(detector_dict)

def post_processing(obj, subParts={}, sublist= []):
    for k, v in obj.items():
        main_parts = list(detector_dict.keys())
        if k in main_parts:
            k = f'{k}\\w+'
            sublist = [k]
            outer_list = []
            outer_list.append(sublist)
            outer_list.append(0.8)
            subParts.update({k: outer_list})
            post_processing(v, subParts, sublist)
                
        else:
            sublist.append(k)
            post_processing(v, subParts, sublist)
    return subParts
            
subPart_processed = post_processing(detector_dict)
#pprint.pprint(subPart_processed)

final_dict = {"childrenToHide": [],
              "subParts": subPart_processed,
              "maxLevel": 3}

pprint.pprint(final_dict)
with open("config_automatic.json", "w") as outfile: 
    json.dump(final_dict, outfile)