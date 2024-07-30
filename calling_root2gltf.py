import argparse
import subprocess

parser = argparse.ArgumentParser(description='Convert detector (to .gltf)')
parser.add_argument('root_file', help='Root file',
                      type=str)
parser.add_argument('-c', '--config_file', help='Json file of detector structure',
                        default='a', type=str)
parser.add_argument('-g', '--gltf_file', help='Gltf file',
                        default='detector.gltf', type=str)

args = parser.parse_args()

subprocess.run(["node", ".", "-c", f'{args.config_file}', "-o", f'{args.gltf_file}', f'{args.root_file}'])