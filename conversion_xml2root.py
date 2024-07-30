
import argparse
import ROOT

def main():
    parser = argparse.ArgumentParser(description='Convert detector')
    parser.add_argument('-c', '--compact', help='Compact file location(s)',
                        required=True, type=str, nargs='+')
    parser.add_argument('-o', '--out', help='Converted file path',
                        default='nothing', type=str)
    parser.add_argument('-v', '--visibility', help='Level of layers in detector',
                        default=9, type=int)

    args = parser.parse_args()

    convert(args.compact, args.out, args.visibility)


def convert(compact_files, out_path, visibility):
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
            ROOT.gGeoManager.Export(f'{cfile[last_slash:len(cfile)-4]}.root')

    else:
        ROOT.gGeoManager.Export(out_path)

if __name__ == '__main__':
    main()