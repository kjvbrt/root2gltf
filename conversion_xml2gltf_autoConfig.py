
import argparse
import ROOT
import subprocess

def main():
    parser = argparse.ArgumentParser(description='Convert detector')
    parser.add_argument('-cm', '--compact_file', help='Compact file location(s)',
                        required=True, type=str, nargs='+')
    parser.add_argument('-cn', '--config_file', help='Json file of detector structure',
                        default='nothing', type=str)
    parser.add_argument('-ro', '--out_root', help='Converted root file path',
                        default='nothing', type=str)
    parser.add_argument('-ri', '--in_root', help='Input root file path (if a root file has already been obtained)',
                        default='nothing', type=str)
    parser.add_argument('-g', '--out_gltf', help='Converted gltf file path',
                        default='nothing', type=str)
    parser.add_argument('-d', '--depth', help='Level of layers in detector',
                        default=9, type=int)

    args = parser.parse_args()

    #if args.in_root != 'nothing' and args.config_file != 'nothing':
     #   gltf_convert(args.config_file, args.out_gltf, args.in_root)
    #else:
    print(args.compact_file)
    root_path = root_convert(args.compact_file, args.out_root, args.depth)

    if args.config_file == 'nothing':
        subprocess.run(["python", "configfile_generator.py", "--compactFile", f'{args.compact_file}'])
    else:
        config_file = args.config_file

    gltf_convert(config_file, args.out_gltf, root_path)
    

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