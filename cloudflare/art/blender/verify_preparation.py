"""Independent scene checks. Run in Blender after loading the authored .blend."""
import json
from pathlib import Path

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

scene = bpy.context.scene
dripper = bpy.data.objects['04 05 Pour-over dripper and filter']
cup = bpy.data.objects['06 Ceramic cup and saucer']
stream = bpy.data.objects['Amber coffee drip']
particles = [o for o in scene.objects if o.name.startswith('Milled coffee particle ')]
assert len(particles) == 170
assert len([o for o in scene.objects if o.name.startswith('Stand ')]) == 4
samples = {}
for frame in list(range(101, 251)) + list(range(250, 100, -1)):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    active = [o for o in particles if max(o.scale) > .001]
    if active:
        assert frame > 118, ('Grounds released too early', frame)
        assert abs(dripper.scale.x - 1) < 1e-5
        assert abs(cup.scale.x - 1) < 1e-5
    if frame >= 148:
        for p in particles:
            local = dripper.matrix_world.inverted() @ p.matrix_world.translation
            assert local.xy.length < .46 and .53 <= local.z <= .58, (frame, p.name, tuple(local))
    outlet = dripper.matrix_world @ Vector((0, 0, -.65))
    if stream.data.bevel_depth > 1e-5:
        rim = cup.matrix_world @ Vector((0, 0, 1.23))
        assert outlet.z - rim.z >= .5, ('Extraction gap', frame)
        start = stream.matrix_world @ stream.data.splines[0].bezier_points[0].co
        assert (start - outlet).length < 1e-5, ('Detached coffee stream', frame)
    signature = [round(v, 6) for v in dripper.location] + [round(stream.data.bevel_depth, 6)]
    if frame in samples:
        assert samples[frame] == signature, ('Reverse mismatch', frame)
    samples[frame] = signature
camera_bounds = []
for frame in (110, 114, 118, 125, 138, 145):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    objects = [bpy.data.objects['Hero bean with curved cleft'], bpy.data.objects['Copper mill hopper']]
    for obj in objects:
        if obj.matrix_world.to_scale().length < .01:
            continue
        points = [world_to_camera_view(scene, scene.camera, obj.matrix_world @ Vector(v)) for v in obj.bound_box]
        ymin, ymax = min(p.y for p in points), max(p.y for p in points)
        assert -.01 <= ymin and ymax <= 1.01, ('Vertical crop', frame, obj.name, ymin, ymax)
        camera_bounds.append([frame, obj.name, round(ymin, 4), round(ymax, 4)])
report = {'status': 'PASS', 'forwardReverseFrames': len(samples), 'particles': len(particles),
          'minimumExtractionGap': .5, 'cameraBounds': camera_bounds}
Path('reports/blender-preparation-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('PREPARATION_CHECK', json.dumps(report))
