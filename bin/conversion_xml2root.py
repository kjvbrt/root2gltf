
import argparse
import ROOT
import subprocess

def main():
    parser = argparse.ArgumentParser(description='Convert detector')
    parser.add_argument('-cm', '--compact', help='Compact file location(s)',
                        required=True, type=str, nargs='+')
    parser.add_argument('-r', '--out_root', help='Converted root file path',
                        default='nothing', type=str)
    parser.add_argument('-v', '--visibility', help='Level of layers in detector',
                        default=9, type=int)
    parser.add_argument('-g', '--out_gltf', help='Converted gltf file path',
                        default='nothing', type=str)
    parser.add_argument('-cn', '--config_file', help='Json file of detector structure',
                        default='a', type=str)
    args = parser.parse_args()

    root_path = root_convert(args.compact, args.out_root, args.visibility)
    gltf_convert(args.config_file, args.out_gltf, root_path)

def root_convert(compact_files, out_path, visibility):
    print('INFO: Converting following compact file(s):')
    for cfile in compact_files:
        print('      ' + cfile)

    ROOT.gSystem.Load('libDDCore')
    description = ROOT.dd4hep.Detector.getInstance()
    for cfile in compact_files:
        description.fromXML(cfile)

    ROOT.gGeoManager.SetVisLevel(visibility)
    ROOT.gGeoManager.SetVisOption(0)

    if out_path == 'nothing':
        counter = 0
        slash_list = []
        for cfile in compact_files:
            for i in cfile:
                counter += 1
                if i == '/':
                    slash_list.append(counter)

            last_slash = max(slash_list)
            root_path = f'{cfile[last_slash:len(cfile)-4]}.root'
            
    else:
        root_path = out_path
    
    ROOT.gGeoManager.Export(root_path)

    return root_path


def gltf_convert(config, gltf, root):
        
    if gltf == 'nothing':
        gltf_path = f'{root[:len(root)-5]}.gltf'
        
    else:
        gltf_path = gltf

    subprocess.run(["node", ".", "-c", f'{config}', "-o", f'{gltf_path}', f'{root}'])

if __name__ == '__main__':
    main()