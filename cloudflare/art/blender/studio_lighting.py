import bpy

def apply_studio_lighting(scene):
    lights = {
        'Large warm softbox': ((1, 0.95, 0.87), 1050, 5),
        'Cool soft fill': ((0.83, 0.90, 1), 420, 4),
        'Copper rim light': ((1, 0.89, 0.73), 1000, 3),
        'Front groove soft light': ((1, 0.95, 0.88), 160, 2.5)
    }

    for name, (color, base_energy, size) in lights.items():
        light = scene.objects[name]
        light.data.color = color
        light.data.size = size
        light.data.shape = 'RECTANGLE'
        light.data.size_y = size * 0.65

        # Clear animation data
        light.data.animation_data_clear()

        # Keyframe energy
        for frame, factor in [(1, 0.82), (72, 1), (112, 1.18), (170, 0.92), (218, 1.12), (270, 0.88), (300, 0.96)]:
            light.data.energy = base_energy * factor
            light.data.keyframe_insert(data_path='energy', frame=frame)

    # Set world background
    background = scene.world.node_tree.nodes['Background']
    background.inputs['Color'].default_value = (0.48, 0.53, 0.62, 1)
    background.inputs['Strength'].default_value = 0.25

    # Enable ray tracing
    scene.eevee.use_raytracing = True
