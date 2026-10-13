import bpy

def apply_studio_finish(scene):
    materials = {
        'Warm ivory glazed ceramic': {
            'Base Color': (.87, .84, .76, 1),
            'Roughness': .24,
            'Coat Weight': .28,
            'Coat Roughness': .18
        },
        'Brushed warm copper': {
            'Base Color': (.42, .24, .13, 1),
            'Metallic': .88,
            'Roughness': .29,
            'Anisotropic': .3
        },
        'Unbleached filter paper': {
            'Base Color': (.66, .59, .45, 1),
            'Roughness': .87
        },
        'Burr mill charcoal steel': {
            'Base Color': (.04, .045, .047, 1),
            'Roughness': .29
        },
        'Bean skin roast progression': {
            'Roughness': .62,
            'Coat Weight': .02
        },
        'Fresh ground coffee': {
            'Roughness': .76
        },
        'Dark amber extracted coffee': {
            'Roughness': .26,
            'Coat Weight': .08,
            'Specular IOR Level': .2
        }
    }

    for name, settings in materials.items():
        mat = bpy.data.materials.get(name)
        if mat is None:
            raise ValueError(f'Material {name} not found')
        nodes = mat.node_tree.nodes
        principled = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if principled is None:
            raise ValueError(f'Principled BSDF node not found in material {name}')

        for socket_name, value in settings.items():
            principled.inputs[socket_name].default_value = value

        bump = next((n for n in nodes if n.type == 'BUMP'), None)
        if bump is not None:
            if name == 'Bean skin roast progression':
                bump.inputs['Strength'].default_value = .30
                bump.inputs['Distance'].default_value = .032
            elif name == 'Fresh ground coffee':
                bump.inputs['Distance'].default_value = .008

        noise = next((n for n in nodes if n.type == 'TEX_NOISE'), None)
        if noise is not None and name == 'Bean skin roast progression':
            noise.inputs['Scale'].default_value = 36
