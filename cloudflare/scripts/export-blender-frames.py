"""Export the approved Blender RGBA renders for the scroll player.

Uses Pillow, never generates or changes scene artwork. Run after visual proof.
"""
from argparse import ArgumentParser
from pathlib import Path
import hashlib
import json
from PIL import Image

parser = ArgumentParser()
parser.add_argument('--input', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
parser.add_argument('--count', type=int, default=300)
parser.add_argument('--quality', type=int, default=82)
args = parser.parse_args()
sources = [args.input / f'frame-{i:04d}.png' for i in range(1, args.count + 1)]
missing = [str(path) for path in sources if not path.is_file()]
if missing:
    raise SystemExit(f'Missing {len(missing)} source frames; first: {missing[0]}')
args.output.mkdir(parents=True, exist_ok=True)
frames = []
for index, source in enumerate(sources, 1):
    target = args.output / f'frame-{index:04d}.webp'
    with Image.open(source) as image:
        if image.size != (960, 840):
            raise SystemExit(f'Unexpected size {image.size}: {source}')
        image.convert('RGBA').save(target, 'WEBP', quality=args.quality, method=3)
    frames.append({'frame': index, 'bytes': target.stat().st_size,
                   'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
for name, index in {'origin': 25, 'roast': 75, 'grinding': 125,
                    'water': 175, 'extraction': 225, 'serving': 290}.items():
    (args.output / f'poster-{name}.webp').write_bytes(
        (args.output / f'frame-{index:04d}.webp').read_bytes())
manifest = {'generator': 'Blender 4.5.9 / authored scene', 'width': 960,
            'height': 840, 'count': args.count, 'totalBytes': sum(f['bytes'] for f in frames),
            'frames': frames}
(args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'frames': args.count, 'bytes': manifest['totalBytes'], 'output': str(args.output)}))
