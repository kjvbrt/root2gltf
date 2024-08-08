
import argparse
import ROOT
import subprocess

def main():
    parser = argparse.ArgumentParser(description='Convert detector')
    parser.add_argument('-cm', '--compact_files', help='Compact file location(s)',
                        required=True, type=str, nargs='+')
    parser.add_argument('-cn_in', '--config_file_in', help='Json file of detector structure to be given',
                        default='nothing', type=str)
    parser.add_argument('-cn_out', '--config_file_out', help='Automatic json file of detector structure file path out',
                        default='nothing', type=str)
    parser.add_argument('-r_out', '--out_root', help='Converted root file path',
                        default='nothing', type=str)
    parser.add_argument('-r_in', '--in_root', help='Input root file path (if a root file has already been obtained)',
                        default='nothing', type=str)
    parser.add_argument('-g', '--out_gltf', help='Converted gltf file path',
                        default='nothing', type=str)
    parser.add_argument('-d', '--depth', help='Level of layers in detector',
                        default=9, type=int)

    args = parser.parse_args()

    for cfile in args.compact_files:
        if args.in_root != 'nothing' and args.config_file != 'nothing':
            gltf_convert(args.config_file, args.out_gltf, args.in_root)

        else:
            root_path = root_convert(cfile, args.out_root, args.depth)
            config_file = automatic_config(args.config_file_in, args.config_file_out, cfile)
            gltf_convert(config_file, args.out_gltf, root_path)


def root_convert(cfile, out_path, visibility):
    print('INFO: Converting following compact file(s):')
    print('      ' + cfile)

    ROOT.gSystem.Load('libDDCore')
    description = ROOT.dd4hep.Detector.getInstance()
    description.fromXML(cfile)

    ROOT.gGeoManager.SetVisLevel(visibility)
    ROOT.gGeoManager.SetVisOption(0)
    root_path = determine_outpath(out_path, cfile, 'root')
    ROOT.gGeoManager.Export(root_path)

    return root_path

def automatic_config(config_in, config_out, cfile):
    if config_in == 'nothing':
        config_file = determine_outpath(config_out, cfile, "json")
        subprocess.run(["python", "configfile_generator.py", "--compactFile", f'{cfile}', '--config_path', f'{config_file}'])
            
    else:
        config_file = config_in
    return config_file


def gltf_convert(config, gltf, root):

    gltf_path = determine_outpath(gltf, root, "gltf")
    subprocess.run(["node", ".", "-c", f'{config}', "-o", f'{gltf_path}', f'{root}'])

def determine_outpath(out_path, file, ending):
    if out_path == 'nothing':
        counter = 0
        slash_list = []
        for i in file:
            counter += 1
            if i == '/':
                slash_list.append(counter)
            if i == '.':
                dot = counter

        if not slash_list:
            path = f'../{ending}_files/{file[:dot-1]}.{ending}'
        else:
            last_slash = max(slash_list)
            if ending == 'json':
                path = f'../configs/{file[last_slash:dot-1]}.{ending}'
            else:
                path = f'../{ending}_files/{file[last_slash:dot-1]}.{ending}'          
    else:
        path = out_path
    return path

if __name__ == '__main__':
    main()