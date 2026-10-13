"""Apply lookdev to the approved master without rebuilding its geometry."""
import sys
from pathlib import Path
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from coffee_journey import material
from studio_finish import apply_studio_finish
from studio_lighting import apply_studio_lighting

root = Path(__file__).resolve().parents[2] / 'reports'
bpy.ops.wm.open_mainfile(filepath=str(root / 'coffee-journey-art-v2.blend'))
scene = bpy.context.scene
apply_studio_finish(scene)
apply_studio_lighting(scene)
stage = material('Studio limestone',(.60,.57,.49),.80,texture=.16,scale=38,bump_distance=.007)
bpy.data.objects['Ivory ceramic presentation surface'].data.materials[0] = stage
scene.eevee.taa_render_samples = 96
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'coffee-journey-studio.blend'))
if '--render' in sys.argv:
    output = root / 'blender-sequence-studio'
    output.mkdir(exist_ok=True)
    for frame in range(1,301):
        scene.frame_set(frame)
        scene.render.filepath = str(output / f'frame-{frame:04d}.png')
        bpy.ops.render.render(write_still=True)
        print('STUDIO_FRAME',frame,flush=True)
