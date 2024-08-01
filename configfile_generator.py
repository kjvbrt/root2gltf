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

def tree(detElement):
    nd = {}
    children = detElement.children()
    for raw_name, child in children:
        dictionary = tree(child)
        nd.update({raw_name: dictionary})
    return nd

total_dict = tree(start)
pprint.pprint(total_dict)