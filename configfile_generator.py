#!/usr/bin/env python
# coding: utf-8

from dd4hep import Detector
import re
from collections import Counter
from argparse import ArgumentParser
from collections import defaultdict
import pprint

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

def tree(detElement, depth):
    nd = {}
    depth += 1
    children = detElement.children()
    for raw_name, child in children:
        if depth > args.maxDepth:
            tree(child, depth)
        else:
            dictionary = tree(child, depth)
            nd.update({raw_name: dictionary})
    return nd

def post_processing(detector_dict):
    main_parts = list(detector_dict.keys())
    for main in main_parts:
        print('yay')


detector_dict = tree(start, 0)
vals = list(detector_dict['VXD_support'].values())
print(vals)
#pprint.pprint(detector_dict)
#final_dict = post_processing(detector_dict)