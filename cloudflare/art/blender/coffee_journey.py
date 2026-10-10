"""Caffè Camillo Colombi — one continuous, editable pour-over scene.

Run with Blender 4.5: blender -b -t 16 --python coffee_journey.py -- --output PATH
No assets, plug-ins, simulations or network access. Frames are independently renderable.
"""
import argparse
import math
from pathlib import Path
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparation_layout import DRIPPER_Z, MILL_Z, add_stand


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, help='PNG output directory')
    parser.add_argument('--frames', help='Comma separated proof frames; overrides start/end')
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=300)
    parser.add_argument('--resolution', type=float, default=1.0, help='Multiplier of 960 x 840')
    parser.add_argument('--samples', type=int, default=48)
    parser.add_argument('--engine', choices=['eevee','cycles'], default='eevee')
    parser.add_argument('--save-blend', help='Master .blend path; defaults beside the output directory')
    parser.add_argument('--build-only', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if args.resolution <= 0 or args.samples < 1:
        parser.error('resolution and samples must be positive')
    frames = [int(x.strip()) for x in args.frames.split(',')] if args.frames else list(range(args.start, args.end + 1))
    if not frames or any(f < 1 or f > 300 for f in frames):
        parser.error('frames must be in 1..300')
    return args, frames


def material(name, color, roughness=.4, metallic=0, texture=0, scale=9, bump_distance=.02):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    shader = nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if texture:
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = scale
        noise.inputs['Detail'].default_value = 4
        noise.inputs['Roughness'].default_value = .72
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = texture
        bump.inputs['Distance'].default_value = bump_distance
        mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        mat.node_tree.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


def vapor_material():
    """Low-density local mist, with no opaque surface or identical wire shapes."""
    mat = bpy.data.materials.new('Dissipating coffee vapor volume')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    volume = nodes.new('ShaderNodeVolumePrincipled')
    volume.inputs['Color'].default_value = (.72,.68,.61,1)
    volume.inputs['Anisotropy'].default_value = .12
    noise = nodes.new('ShaderNodeTexNoise')
    noise.noise_dimensions = '4D'
    noise.inputs['Scale'].default_value = 4.8
    noise.inputs['Detail'].default_value = 2
    for f,w in [(1,0),(300,1.7)]:
        noise.inputs['W'].default_value = w
        noise.inputs['W'].keyframe_insert('default_value',frame=f)
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .35
    ramp.color_ramp.elements[0].color = (0,0,0,1)
    ramp.color_ramp.elements[1].position = .72
    ramp.color_ramp.elements[1].color = (.28,.28,.28,1)
    mat.node_tree.links.new(noise.outputs['Fac'],ramp.inputs[0])
    # Fade to zero before the mesh boundary, so the volume has no visible shell.
    coordinates = nodes.new('ShaderNodeTexCoord')
    center = nodes.new('ShaderNodeVectorMath'); center.operation = 'SUBTRACT'
    center.inputs[1].default_value = (.5,.5,.5)
    radius = nodes.new('ShaderNodeVectorMath'); radius.operation = 'LENGTH'
    fade = nodes.new('ShaderNodeMapRange')
    fade.inputs['From Min'].default_value = .04
    fade.inputs['From Max'].default_value = .44
    fade.inputs['To Min'].default_value = 1
    fade.inputs['To Max'].default_value = 0
    fade.clamp = True
    density = nodes.new('ShaderNodeMath'); density.operation = 'MULTIPLY'
    links = mat.node_tree.links
    links.new(coordinates.outputs['Generated'],center.inputs[0])
    links.new(center.outputs['Vector'],radius.inputs[0])
    links.new(radius.outputs['Value'],fade.inputs['Value'])
    links.new(fade.outputs['Result'],density.inputs[0])
    links.new(ramp.outputs['Color'],density.inputs[1])
    links.new(density.outputs[0],volume.inputs['Density'])
    mat.node_tree.links.new(volume.outputs['Volume'],output.inputs['Volume'])
    return mat


def mesh_object(name, verts, faces, mat, parent=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat:
        mesh.materials.append(mat)
    obj.parent = parent
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def lathe(name, profile, mat, parent=None, segments=96, flutes=0):
    verts = []
    for radius, z in profile:
        for i in range(segments):
            angle = 2 * math.pi * i / segments
            ridge = flutes * math.cos(angle * 20) * radius
            verts.append(((radius + ridge) * math.cos(angle), (radius + ridge) * math.sin(angle), z))
    faces = []
    for j in range(len(profile)-1):
        for i in range(segments):
            a = j * segments + i
            b = j * segments + (i+1) % segments
            faces.append((a, b, b+segments, a+segments))
    return mesh_object(name, verts, faces, mat, parent)


def sphere(name, location, scale, mat, parent=None, segments=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    obj.parent = parent
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def curve(name, points, radius, mat, parent=None, cyclic=False, caps=True):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 16
    data.bevel_depth = radius
    data.bevel_resolution = 4
    data.use_fill_caps = caps
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = 'AUTO'
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def pose(obj, frame, location=None, scale=None, rotation=None):
    if location is not None:
        obj.location = location
        obj.keyframe_insert(data_path='location', frame=frame)
    if scale is not None:
        obj.scale = (scale, scale, scale) if isinstance(scale, (int, float)) else scale
        obj.keyframe_insert(data_path='scale', frame=frame)
    if rotation is not None:
        obj.rotation_euler = rotation
        obj.keyframe_insert(data_path='rotation_euler', frame=frame)


def arrive_leave(obj, first, arrival, departure, last, location=(0, 0, 0), entry=(-6, 0, 0), exit=(6, 0, 0)):
    pose(obj, 1, entry, .0001)
    pose(obj, first, entry, .0001)
    pose(obj, arrival, location, 1)
    pose(obj, departure, location, 1)
    if last > departure:
        pose(obj, last, exit, .0001)
        pose(obj, 300, exit, .0001)


def bean(name, mat, seam_mat, parent):
    """Closed outward-facing shell; dense continuous strips follow the cleft.

    Single pole vertices avoid collapsed quads. Angular sampling concentrates
    geometry at the groove, so its dark floor never jumps between coarse faces.
    """
    rings, sides = 72, 128
    angles = []
    for i in range(sides):
        u = -math.pi + math.tau * i / sides
        angles.append(math.copysign(math.pi * (abs(u)/math.pi)**1.5, u))
    verts = [(0, 0, 1.10)]
    for j in range(1, rings):
        theta = math.pi * j / rings
        z = 1.10 * math.cos(theta)
        r = math.sin(theta)
        mid = .065 * math.sin(z * 3.2) + .025 * z
        for angle in angles:
            phi = 1.5 * math.pi + angle
            x = .71 * r * math.cos(phi)
            y = .49 * r * math.sin(phi)
            wave = .009 * math.sin(17 * phi + z * 6) + .005 * math.sin(29 * phi-z*11)
            x *= 1 + wave
            y *= 1 + wave
            front = math.exp(-(angle/.65)**4)
            x += mid * r * front
            cleft = math.exp(-(angle/.135)**2)
            lips = math.exp(-((abs(angle)-.22)/.085)**2)
            y += (.225 * cleft - .022 * lips) * r*r
            verts.append((x, y, z + .014 * math.sin(phi*7)*r*r))
    faces = []
    seam_faces = []
    for i in range(sides):
        faces.append((0, 1+i, 1+(i+1)%sides))
    for j in range(rings-2):
        for i in range(sides):
            a = 1+j*sides+i
            b = 1+j*sides+(i+1)%sides
            faces.append((a,a+sides,b+sides,b))
            if abs((angles[i]+angles[(i+1)%sides])*.5) < .07:
                seam_faces.append(len(faces)-1)
    south = len(verts)
    verts.append((0, 0, -1.10))
    last = 1+(rings-2)*sides
    for i in range(sides):
        faces.append((last+i, south, last+(i+1)%sides))
    obj = mesh_object(name, verts, faces, mat, parent)
    obj.data.materials.append(seam_mat)
    for index in seam_faces:
        obj.data.polygons[index].material_index = 1
    return obj


def disk(name, radius, z, mat, parent, inner=0, rough=0):
    n = 96
    if inner == 0:
        verts = [(0,0,z)] + [(radius*math.cos(2*math.pi*i/n), radius*math.sin(2*math.pi*i/n), z+rough*math.sin(i*2.4)) for i in range(n)]
        return mesh_object(name, verts, [(0,1+i,1+(i+1)%n) for i in range(n)], mat, parent)
    verts = [(inner*math.cos(2*math.pi*i/n), inner*math.sin(2*math.pi*i/n), z) for i in range(n)]
    verts += [(radius*math.cos(2*math.pi*i/n), radius*math.sin(2*math.pi*i/n), z+rough*math.sin(i*2.4)) for i in range(n)]
    return mesh_object(name, verts, [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)], mat, parent)


def light(name, location, power, color, size):
    bpy.ops.object.light_add(type='AREA', location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = power
    obj.data.color = color
    obj.data.shape = 'DISK'
    obj.data.size = size
    obj.rotation_euler = (Vector((0,0,2.3))-obj.location).to_track_quat('-Z','Y').to_euler()


def build(args):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = args.samples
    if args.engine == 'cycles':
        scene.render.engine = 'CYCLES'
        preferences = bpy.context.preferences.addons['cycles'].preferences
        preferences.compute_device_type = 'HIP'
        preferences.refresh_devices()
        gpu = [device for device in preferences.devices if device.type == 'HIP']
        if not gpu:
            raise RuntimeError('HIP GPU unavailable; choose eevee or configure a render device explicitly')
        for device in preferences.devices:
            device.use = device.type == 'HIP'
        scene.cycles.device = 'GPU'
        scene.cycles.samples = args.samples
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 8
        scene.cycles.seed = 17
    scene.render.resolution_x = round(960*args.resolution)
    scene.render.resolution_y = round(840*args.resolution)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.render.fps = 30
    scene.frame_start, scene.frame_end = 1,300
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get('Background').inputs[0].default_value = (.27,.20,.13,1)
    scene.world.node_tree.nodes.get('Background').inputs[1].default_value = .45
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.image_settings.compression = 35
    scene.render.use_file_extension = True

    cream = material('Warm ivory glazed ceramic',(.72,.59,.41),.23,texture=.012,scale=38,bump_distance=.003)
    cream.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value = .32
    cream.node_tree.nodes.get('Principled BSDF').inputs['Coat Roughness'].default_value = .18
    paper = material('Unbleached filter paper',(.70,.52,.31),.83,texture=.10,scale=70,bump_distance=.006)
    copper = material('Brushed warm copper',(.48,.19,.075),.28,.83,texture=.035,scale=45,bump_distance=.005)
    darkmetal = material('Burr mill charcoal steel',(.035,.027,.022),.32,.7)
    wood = material('Roaster walnut handle',(.105,.042,.015),.48,texture=.21,scale=14)
    raw = material('Bean skin roast progression',(.30,.30,.13),.58,texture=.38,scale=22,bump_distance=.045)
    seam = material('Deep bean cleft',(.063,.034,.014),.72,texture=.12,scale=21,bump_distance=.009)
    grounds = material('Fresh ground coffee',(.043,.019,.008),.67,texture=.44,scale=32)
    coffee = material('Dark amber extracted coffee',(.026,.009,.003),.17)
    coffee.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value = .38
    foam = material('Bloom coffee bubbles',(.055,.024,.009),.40,texture=.18,scale=24)
    water = material('Warm translucent water',(.96,.99,1),.055,0)
    water.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value = 1
    water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value = 1.333
    steam = vapor_material()
    # Animated skin makes the roasting process visible, independently of time stepping.
    skin = raw.node_tree.nodes.get('Principled BSDF')
    for f,c in [(1,(.30,.30,.13,1)),(48,(.30,.30,.13,1)),(66,(.26,.115,.035,1)),(95,(.092,.030,.011,1)),(300,(.092,.030,.011,1))]:
        skin.inputs['Base Color'].default_value = c
        skin.inputs['Base Color'].keyframe_insert('default_value',frame=f)

    # Permanent circular stage keeps the same spatial context through all six phases.
    lathe('Ivory ceramic presentation surface',[(0,-.17),(2.75,-.17),(2.82,-.09),(2.82,-.02),(2.76,.025),(0,.025)],cream)
    stage_ring = lathe('Copper inlay on stage',[(2.72,.027),(2.75,.027)],copper)

    hero = group('01 Origin bean — continuous hero')
    hero_shell = bean('Hero bean with curved cleft',raw,seam,hero)
    for f,loc,s,rot in [
        (1,(0,-.1,2.5),1.8,(.15,-.23,-.3)),
        (45,(0,0,2.65),1.8,(.02,.2,.17)),
        (72,(0,0,2.9),1.5,(.08,-.18,-.1)),
        (100,(0,0,3.15),1.35,(.10,.14,.12)),
        (114,(0,0,5.55),.50,(.2,.4,.4)),
        (132,(0,0,4.65),.0001,(.5,.8,1.0)),
        (300,(0,0,4.65),.0001,(.5,.8,1.0))]:
        pose(hero,f,loc,s,rot)

    # The hero cracks open before the grinder arrives. Two roasted halves pull
    # apart with a dark fracture face, while a burst of visible grounds leaves
    # the bean; eight larger pieces follow ballistic paths into the filter.
    fracture = group('01b Bean fracture and particle burst')
    left_half = bean('Bean fracture left half',raw,seam,fracture)
    right_half = bean('Bean fracture right half',raw,seam,fracture)
    for half, side in ((left_half,-1),(right_half,1)):
        pose(half,1,location=(0,0,3.0),scale=.0001,rotation=(.2,.1,side*.2))
        pose(half,72,location=(0,0,3.0),scale=.0001,rotation=(.2,.1,side*.2))
        pose(half,78,location=(side*.05,0,3.0),scale=(.52,.72,.72),rotation=(.2,.1,side*.2))
        pose(half,91,location=(side*.37,.02,3.12),scale=(.52,.72,.72),rotation=(.2,side*.6,side*.45))
        pose(half,111,location=(side*.60,.08,3.20),scale=(.50,.70,.70),rotation=(.3,side*1.0,side*.75))
        pose(half,128,location=(side*.60,.08,3.20),scale=.0001,rotation=(.3,side*1.0,side*.75))
        pose(half,300,location=(side*.60,.08,3.20),scale=.0001,rotation=(.3,side*1.0,side*.75))
    pose(hero,72,scale=1.8,location=(0,0,2.65))
    pose(hero,78,scale=.0001,location=(0,0,2.65))
    pose(hero,300,scale=.0001,location=(0,0,2.65))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1)
    fracture_proto = bpy.context.object
    fracture_mesh = fracture_proto.data
    fracture_mesh.materials.append(grounds)
    bpy.data.objects.remove(fracture_proto,do_unlink=True)
    fracture_rng = random.Random(9041)
    for i in range(30):
        piece = bpy.data.objects.new('Fractured bean particle %02d' % i, fracture_mesh)
        bpy.context.collection.objects.link(piece)
        angle = fracture_rng.uniform(0, math.tau)
        if i < 8:
            radius = math.sqrt(fracture_rng.random()) * .34
            burst = (fracture_rng.uniform(-1.25,1.25), fracture_rng.uniform(-.38,.65), fracture_rng.uniform(2.55,3.75))
            target = (radius*math.cos(angle), radius*math.sin(angle), DRIPPER_Z+.54)
            land = 112 + i*2
            fade = land + 18
        else:
            burst = (fracture_rng.uniform(-2.4,2.4), fracture_rng.uniform(-.85,1.1), fracture_rng.uniform(2.1,4.2))
            target = (burst[0]*1.16, burst[1]*1.12, burst[2]-.8)
            land = 106 + i
            fade = 124 + i//2
        size = fracture_rng.uniform(.025,.065) if i < 8 else fracture_rng.uniform(.014,.040)
        pose(piece,1,location=(0,0,3.0),scale=.0001)
        pose(piece,74,location=(0,0,3.0),scale=.0001)
        pose(piece,81,location=(0,0,3.0),scale=.0001)
        pose(piece,90,location=burst,scale=size,rotation=(angle,.7,angle*.4))
        pose(piece,land,location=target,scale=size,rotation=(angle+1.2,.3,angle))
        pose(piece,fade,location=target,scale=.0001)
        pose(piece,300,location=target,scale=.0001)

    roaster = group('02 Roasting copper pan')
    lathe('Open shallow copper roasting vessel',[(.09,0),(.8,0),(1.45,.12),(1.73,.40),(1.80,.56),(1.78,.61),(1.73,.61),(1.68,.43),(1.43,.18),(.8,.075),(.09,.075)],copper,roaster)
    curve('Roaster stem',[(1.63,0,.30),(2.1,0,.35),(2.6,0,.48)],.08,copper,roaster)
    curve('Walnut roaster handle',[(2.15,0,.37),(2.55,0,.47),(2.94,0,.54)],.15,wood,roaster)
    arrive_leave(roaster,45,66,96,120,location=(0,0,1.2),entry=(-6,0,.7),exit=(-6,0,.7))
    rng = random.Random(4107)
    for i in range(14):
        b = bean('Roasting bean %02d'%i,raw,seam,roaster)
        a = i*2.399
        r = .6+.065*(i%7)
        b.location=(r*math.cos(a),r*math.sin(a),.31)
        b.scale=(.19,.19,.19)
        b.rotation_euler=(math.pi/2,rng.uniform(-.8,.8),a)
    for i in range(3):
        g = group('Roast aroma %02d'%i)
        x = (i-1)*.30
        sphere('Roast vapor local mist %02d'%i,(x,.26,2.08+i*.13),(.25+i*.035,.21,.44+i*.04),steam,g,segments=20)
        arrive_leave(g,55,76,93,112)

    grinder = group('03 Burr grinder')
    # Open hopper, compact burr chamber, and visible copper outlet.
    lathe('Copper mill hopper',[(.28,.36),(.77,.87),(.81,.94),(.81,1.02),(.76,1.02),(.73,.90),(.26,.40)],copper,grinder)
    lathe('Charcoal grinding chamber',[(.20,-.45),(.45,-.35),(.49,.30),(.44,.39),(.20,.39),(.20,-.45)],darkmetal,grinder)
    lathe('Copper grinding collar',[(.46,.05),(.50,.05),(.50,.19),(.46,.19)],copper,grinder)
    lathe('Coffee outlet',[(.12,-.72),(.25,-.72),(.29,-.43),(.12,-.43)],copper,grinder)
    burr = lathe('Rotating exposed burr',[(.08,.38),(.29,.39),(.32,.45),(.08,.47)],darkmetal,grinder,flutes=.10)
    pose(burr,101,rotation=(0,0,0))
    pose(burr,154,rotation=(0,0,math.pi*15))
    crank = curve('Mill crank',[(0,0,1.08),(0,.46,1.08),(.55,.46,1.08)],.045,copper,grinder)
    sphere('Crank wooden knob',(.58,.46,1.10),(.10,.10,.15),wood,grinder)
    arrive_leave(grinder,92,117,141,165,location=(0,0,MILL_Z),entry=(5,0,MILL_Z),exit=(5,0,MILL_Z))

    cup = group('06 Ceramic cup and saucer')
    lathe('Cream cup with genuine inner wall',[(0,.10),(.58,.10),(.68,.17),(.77,.36),(.82,1.18),(.80,1.23),(.75,1.23),(.73,1.15),(.67,.36),(.54,.22),(0,.22)],cream,cup)
    lathe('Copper cup foot',[(.55,.10),(.59,.10),(.59,.16),(.55,.16)],copper,cup)
    curve('Ceramic cup handle',[(.75,0,.99),(1.18,0,1.03),(1.34,0,.70),(1.16,0,.36),(.72,0,.40)],.095,cream,cup)
    lathe('Rounded saucer',[(0,.06),(.8,.06),(1.12,.08),(1.25,.14),(1.27,.18),(1.20,.20),(.8,.13),(0,.13)],cream,cup)
    liquid = disk('Coffee surface in cup',.705,.35,coffee,cup)
    for f,z,s in [(1,.35,.0001),(181,.35,.0001),(207,.35,1),(245,.88,1),(270,.97,1),(300,.97,1)]:
        radius = .665 + .06*max(0,z-.36)/.79
        pose(liquid,f,location=(0,0,z-.35),scale=(s*radius/.705,s*radius/.705,s))
    arrive_leave(cup,100,118,300,300,location=(0,0,.04),entry=(0,0,-3.5),exit=(0,0,.04))
    # Final serving presentation: cup travels forward and grows while dripper lifts away.
    pose(cup,250,(0,0,.04),1)
    pose(cup,285,(0,-.25,.52),1.45,rotation=(0,0,-.15))
    pose(cup,300,(0,-.25,.52),1.45,rotation=(0,0,-.15))

    dripper = group('04 05 Pour-over dripper and filter')
    add_stand(curve, copper, dripper)
    lathe('Fluted ceramic dripper',[(.22,-.65),(.32,-.61),(.95,.48),(1.01,.54),(1.02,.62),(.94,.63),(.90,.49),(.29,-.53),(.22,-.56)],cream,dripper,flutes=.018)
    lathe('Copper dripper collar',[(.25,-.68),(.34,-.68),(.34,-.58),(.25,-.58)],copper,dripper)
    lathe('Dripper support rim',[(.23,-.67),(.84,-.67),(.84,-.60),(.23,-.60)],cream,dripper)
    curve('Dripper handle',[(.81,0,.35),(1.19,0,.39),(1.25,0,.05),(.65,0,-.13)],.065,cream,dripper)
    lathe('Open unbleached conical filter',[(.13,-.52),(.30,-.48),(.85,.53),(.90,.72),(.91,.75),(.88,.75),(.83,.54),(.28,-.44),(.13,-.49)],paper,dripper,flutes=.007)
    bed = lathe('Uneven ground coffee bed',[(0,-.43),(.25,-.42),(.51,.16),(.70,.49),(.54,.53),(0,.54)],grounds,dripper,flutes=.008)
    pose(bed,1,scale=.0001)
    pose(bed,123,scale=.0001)
    pose(bed,138,scale=1)
    pose(bed,300,scale=1)
    bloom = disk('Wet coffee bloom surface',.65,.551,foam,dripper,rough=.004)
    pose(bloom,1,scale=.0001)
    pose(bloom,164,scale=.0001)
    pose(bloom,192,scale=1)
    pose(bloom,219,scale=1)
    pose(bloom,245,scale=.96)
    pose(bloom,300,scale=.96)
    arrive_leave(dripper,105,118,250,283,location=(0,0,DRIPPER_Z),entry=(0,0,-4),exit=(0,0,7))
    # Grind particles carry the material through the same space into the filter.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1)
    proto=bpy.context.object
    particle_mesh=proto.data
    particle_mesh.materials.append(grounds)
    bpy.data.objects.remove(proto,do_unlink=True)
    for i in range(170):
        p=bpy.data.objects.new('Milled coffee particle %03d'%i,particle_mesh)
        bpy.context.collection.objects.link(p)
        angle=rng.uniform(0,2*math.pi)
        radius=math.sqrt(rng.random())*.43
        start=120+i%10
        size=rng.uniform(.017,.040)
        source=(rng.uniform(-.14,.14),rng.uniform(-.14,.14),rng.uniform(MILL_Z-.71,MILL_Z-.65))
        mid=(radius*math.cos(angle)*.30,radius*math.sin(angle)*.3,DRIPPER_Z+.77)
        target=(radius*math.cos(angle),radius*math.sin(angle),DRIPPER_Z+.54+rng.uniform(0,.025))
        pose(p,1,source,.0001)
        pose(p,start,source,.0001)
        pose(p,start+4,source,size,rotation=(rng.random(),rng.random(),rng.random()))
        pose(p,start+10,mid,size)
        pose(p,start+18,target,size)
        pose(p,251,target,size)
        pose(p,280,(target[0],target[1],7),.0001)
        pose(p,300,(target[0],target[1],7),.0001)
    # Visible dry grounds texture follows the filter; particles remain the flow.
    for i in range(55):
        a=rng.uniform(0,math.tau)
        r=math.sqrt(rng.random())*.61
        p=bpy.data.objects.new('Ground bed grain %02d'%i,particle_mesh)
        bpy.context.collection.objects.link(p)
        p.parent=dripper
        p.location=(r*math.cos(a),r*math.sin(a),.54+rng.uniform(0,.025))
        pose(p,1,scale=.0001)
        pose(p,128+i%9,scale=.0001)
        pose(p,134+i%9,scale=rng.uniform(.014,.022))

    kettle=group('04 Gooseneck kettle')
    sphere('Cream kettle body',(-1.95,.25,3.55),(.71,.64,.67),cream,kettle)
    lathe('Copper kettle lid',[(0,4.18),(.43,4.18),(.47,4.23),(.37,4.29),(0,4.29)],copper,kettle).location=(-1.95,.25,0)
    sphere('Walnut lid knob',(-1.95,.25,4.34),(.10,.10,.09),wood,kettle)
    spout_tip = Vector((0,-.14,3.48))
    curve('Copper gooseneck spout',[(-1.43,.15,3.29),(-1.13,.10,3.24),(-.97,.03,3.70),(-.68,-.07,3.88),(-.24,-.14,3.65),spout_tip],.057,copper,kettle,caps=False)
    curve('Kettle handle',[(-2.42,.25,3.93),(-2.95,.25,4.10),(-3.12,.25,3.65),(-2.61,.25,3.23)],.083,wood,kettle)
    arrive_leave(kettle,150,166,200,224,entry=(-6,0,0),exit=(-6,0,0))
    pose(kettle,176,rotation=(0,-.08,0))
    pose(kettle,196,rotation=(0,-.08,0))
    waterflow=group('04 Water pouring into filter')
    ribbon=curve('Continuous water ribbon',[spout_tip,(0,-.14,3.1),(0,-.12,2.8),(0,-.1,2.50)],.027,water,waterflow)
    # NURBS endpoints are deterministic when arbitrary frames are sought; no
    # unkeyed Bezier handles can retain coordinates from the final baked frame.
    ribbon.data.splines.remove(ribbon.data.splines[0])
    water_spline = ribbon.data.splines.new('NURBS')
    water_spline.points.add(3)
    water_spline.order_u = 3
    water_spline.use_endpoint_u = True
    for f,radius in [(1,0),(165,0),(171,.012),(200,.012),(208,0),(300,0)]:
        ribbon.data.bevel_depth=radius
        ribbon.data.keyframe_insert('bevel_depth',frame=f)
    for i in range(9):
        a=math.tau*i/9
        ripple=curve('Bloom concentric ripple %02d'%i,[(.1*math.cos(a),.1*math.sin(a),.561),(.30*math.cos(a+.22),.30*math.sin(a+.22),.565),(.53*math.cos(a+.35),.53*math.sin(a+.35),.561)],.004,water,dripper)
        for f,radius in [(1,0),(171,0),(190,.0015),(208,.0015),(219,0),(300,0)]:
            ripple.data.bevel_depth=radius
            ripple.data.keyframe_insert('bevel_depth',frame=f)
    # Extracted coffee drains through the actual open bottom and fills the cup.
    extraction=group('05 Amber coffee extraction')
    coffee_stream = curve('Amber coffee drip',[(0,0,DRIPPER_Z-.65),(.015,0,1.63),(-.008,0,1.40),(0,0,.86)],.022,coffee,extraction)
    # Reveal the stream at the outlet; translating a tiny curve detached its source.
    for f,radius in [(1,0),(195,0),(204,.022),(240,.022),(250,0),(300,0)]:
        coffee_stream.data.bevel_depth = radius
        coffee_stream.data.keyframe_insert('bevel_depth', frame=f)
    for i in range(12):
        drop=sphere('Extraction droplet %02d'%i,(0,0,1.78),(.03,.03,.055),coffee,segments=16)
        phase=i*3
        pose(drop,1,scale=.0001)
        pose(drop,192+phase,location=(0,0,DRIPPER_Z-.65),scale=.0001)
        pose(drop,196+phase,location=(0,0,1.78),scale=(.028,.028,.06))
        pose(drop,206+phase,location=(0,0,.75),scale=(.028,.028,.045))
        pose(drop,208+phase,scale=.0001)
        pose(drop,300,scale=.0001)
    for i in range(3):
        g=group('06 Cup aroma %02d'%i)
        x=(-.25,.10,.28)[i]
        sphere('Cup vapor local mist %02d'%i,(x,.05+i*.07,1.42+i*.16),(.20+i*.025,.16,.33+i*.07),steam,g,segments=20)
        g.parent=cup
        arrive_leave(g,246,270,300,300)

    light('Large warm softbox',(-4,-4,7),1050,(1,.82,.64),5)
    light('Cool soft fill',(5,-1,5),850,(.78,.86,1),4)
    light('Copper rim light',(1,4,6),1450,(1,.57,.25),3)
    light('Front groove soft light',(0,-5,3.3),120,(1,.86,.72),2.5)
    bpy.ops.object.camera_add(location=(5.0,-9.7,6.7))
    camera=bpy.context.object
    camera.name='Single continuous camera'
    camera.data.type='ORTHO'
    camera.data.ortho_scale=7.35
    scene.camera=camera
    for f,pos,target,ortho in [(1,(4.8,-10.5,6.3),(0,0,2.5),6.2),(100,(4.8,-10.5,6.7),(0,0,2.8),7.5),(145,(5.1,-10.4,7.1),(0,0,2.85),7.5),(185,(5.4,-10.4,7.3),(-.45,0,2.35),5.8),(245,(5.1,-10.3,7.0),(0,0,1.85),5.0),(285,(4.4,-10.0,6.0),(0,-.1,1.7),4.6),(300,(4.4,-10.0,6.0),(0,-.1,1.7),4.6)]:
        rotation=(Vector(target)-Vector(pos)).to_track_quat('-Z','Y').to_euler()
        pose(camera,f,pos,rotation=rotation)
        camera.data.ortho_scale=ortho
        camera.data.keyframe_insert('ortho_scale',frame=f)
    for f,name in [(1,'01 Origem'),(51,'02 Torra'),(101,'03 Moagem'),(151,'04 Água'),(201,'05 Filtragem'),(251,'06 Servir')]:
        scene.timeline_markers.new(name,frame=f)
    # Clamp all Bezier handles to prevent overshoot in scales/positions. No frame handlers.
    for action in bpy.data.actions:
        try:
            channels=action.fcurves
        except AttributeError:
            channels=[]
            for layer in action.layers:
                for strip in layer.strips:
                    for slot in action.slots:
                        bag=strip.channelbag(slot)
                        if bag:
                            channels.extend(bag.fcurves)
        for fc in channels:
            for point in fc.keyframe_points:
                point.handle_left_type=point.handle_right_type='AUTO_CLAMPED'
    # Bake world-space endpoints after transform interpolation is finalized.
    # The stream shares the real spout tip at every independently-rendered frame;
    # moving/scaling the kettle never leaves a detached floating ribbon.
    stream_points = ribbon.data.splines[0].points
    for frame in range(151,225):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        source = kettle.matrix_world @ spout_tip
        target = dripper.matrix_world @ Vector((0,-.1,.557))
        points = [source, Vector((source.x,source.y,source.z*.67+target.z*.33)), source.lerp(target,.70), target]
        for point,co in zip(stream_points,points):
            point.co = (*co,1)
            point.keyframe_insert('co',frame=frame)
    tip_error = 0
    for frame in range(151,201):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        tip_error = max(tip_error, (Vector(stream_points[0].co[:3])-kettle.matrix_world@spout_tip).length)
    assert tip_error < .00001, 'Water stream detached from gooseneck tip'
    scene['water_spout_max_endpoint_error'] = tip_error
    scene['project']='Caffè Camillo Colombi — continuous pour-over journey'
    scene['render_contract']='960x840 RGBA; 300 frames at 30fps; one scene/camera; independent frame rendering'
    scene['visual_style']='Warm editorial 3D; no claim of photorealistic reproduction'
    scene.frame_set(1)
    return scene


def main():
    args,frames=arguments()
    output=Path(args.output).resolve()
    output.mkdir(parents=True,exist_ok=True)
    scene=build(args)
    master=Path(args.save_blend).resolve() if args.save_blend else output.parent/'coffee-journey-master.blend'
    master.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(master))
    print('COFFEE_JOURNEY_MASTER',str(master),flush=True)
    if not args.build_only:
        for frame in frames:
            scene.frame_set(frame)
            scene.render.filepath=str(output/('frame-%04d.png'%frame))
            bpy.ops.render.render(write_still=True)
            print('COFFEE_JOURNEY_FRAME',frame,flush=True)


if __name__=='__main__':
    main()
