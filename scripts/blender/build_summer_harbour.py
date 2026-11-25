# Nordic summer harbour models for the Godot slice (owner decision, 25 Nov 2026).
# Run: blender -b --python scripts/blender/build_summer_harbour.py -- <assets-cache> <out-dir>
# Builds painted-timber and brick buildings sized to the game footprints (1 unit = 1 tile) with
# CC0 Poly Haven PBR materials, exports each as GLB, and exports the creature bases from
# docs/design/coastal-creatures.blend. Everything is generated, so it is reproducible from source.
import bpy, bmesh, math, os, sys

argv = sys.argv[sys.argv.index('--') + 1:]
CACHE, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def texture_material(name, surface, tint=(1, 1, 1, 1), scale=1.0, rough=None):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
    base = os.path.join(CACHE, 'textures', surface)
    coord = nt.nodes.new('ShaderNodeTexCoord'); mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (scale, scale, scale)
    nt.links.new(coord.outputs['UV'], mapping.inputs['Vector'])
    def image(file, colour):
        node = nt.nodes.new('ShaderNodeTexImage'); node.image = bpy.data.images.load(os.path.join(base, file))
        node.image.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'
        nt.links.new(mapping.outputs['Vector'], node.inputs['Vector']); return node
    col = image('color.jpg', True)
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
    nt.links.new(col.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = tint
    nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    arm = image('arm.jpg', False); sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(arm.outputs['Color'], sep.inputs['Color'])
    if rough is None: nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    else: bsdf.inputs['Roughness'].default_value = rough
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    nrm = image('normal.jpg', False); nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(nrm.outputs['Color'], nmap.inputs['Color']); nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def flat_material(name, colour, rough=.5, metal=0., emission=None):
    mat = bpy.data.materials.new(name); mat.use_nodes = True; b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = colour; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emission: b.inputs['Emission Color'].default_value = emission[0]; b.inputs['Emission Strength'].default_value = emission[1]
    return mat

def box(name, size, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    uv_box(o); o.data.materials.append(mat); return o

def cylinder(name, r, depth, loc, mat, verts=24, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts, rotation=rot)
    o = bpy.context.object; o.name = name; uv_box(o); o.data.materials.append(mat); return o

def uv_box(o, scale=1.0):
    # World-scale box projection: texel density stays constant across buildings of any size.
    me = o.data; bm = bmesh.new(); bm.from_mesh(me); uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            v = o.matrix_world @ l.vert.co
            u, w = (v.y, v.z) if ax == 0 else (v.x, v.z) if ax == 1 else (v.x, v.y)
            l[uv].uv = (u * scale, w * scale)
    bm.to_mesh(me); bm.free()

def gable_roof(name, width, depth, base, rise, mat, overhang=.12):
    w, d = width / 2 + overhang, depth / 2 + overhang
    verts = [(-w, -d, base), (w, -d, base), (w, d, base), (-w, d, base), (0, -d, base + rise), (0, d, base + rise)]
    faces = [(0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4), (0, 3, 2, 1)]
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.06); bm.to_mesh(me); bm.free()
    uv_box(o, 1.6); me.materials.append(mat); return o

def windows(prefix, width, depth, sill, height, count, glass, trim, side_y=True):
    for i in range(count):
        x = -width / 2 + (i + .5) * width / count
        for s in (-1, 1) if side_y else (1,):
            box(f'{prefix}-trim-{i}-{s}', (.42, .05, .52), (x, s * (depth / 2 + .02), sill + height / 2), trim)
            box(f'{prefix}-glass-{i}-{s}', (.32, .05, .4), (x, s * (depth / 2 + .035), sill + height / 2), glass)

def export(name):
    for o in bpy.data.objects: o.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_apply=True, export_image_format='JPEG', export_jpeg_quality=88)

def materials():
    return {
        'red': texture_material('falu-red-timber', 'painted-wood', (0.62, 0.13, 0.09, 1), .9),
        'ochre': texture_material('ochre-timber', 'painted-wood', (0.86, 0.62, 0.25, 1), .9),
        'white': texture_material('white-trim', 'painted-wood', (0.95, 0.94, 0.9, 1), 1.4),
        'brick': texture_material('harbour-brick', 'brick', scale=.7),
        'slate': texture_material('slate-roof', 'slate-roof', scale=.8),
        'tin': texture_material('corrugated-roof', 'corrugated-iron', (0.55, 0.6, 0.62, 1), .8),
        'stone': texture_material('granite-plinth', 'terrain-granite', scale=.6),
        'timber': texture_material('tarred-timber', 'timber', (0.55, 0.45, 0.36, 1), 1.2),
        'steel': texture_material('painted-steel', 'steel-plate', (0.3, 0.36, 0.38, 1), .9),
        'glass': flat_material('lamplit-glass', (0.25, 0.32, 0.36, 1), .08, 0, ((1.0, .72, .38, 1), 2.2)),
        'lamp': flat_material('lantern', (1, .93, .78, 1), .2, 0, ((1, .9, .65, 1), 8)),
    }

def smelter():
    reset(); m = materials()
    box('plinth', (2.9, 2.9, .22), (0, 0, .11), m['stone'])
    box('hall', (2.6, 2.2, 1.5), (0, 0, .97), m['brick'])
    gable_roof('roof', 2.6, 2.2, 1.72, .7, m['slate'])
    cylinder('chimney', .22, 2.4, (.75, .55, 2.2), m['brick'], 20)
    cylinder('chimney-cap', .27, .12, (.75, .55, 3.42), m['steel'], 20)
    box('door', (.7, .06, 1.0), (0, -1.12, .72), m['timber'])
    box('door-trim', (.84, .05, 1.1), (0, -1.11, .76), m['white'])
    windows('w', 2.6, 2.2, .75, .6, 3, m['glass'], m['white'])
    box('hopper', (.6, .6, .5), (-1.4, 0, .9), m['steel'])
    export('smelter')

def drill():
    reset(); m = materials()
    box('pad', (2.8, 2.8, .18), (0, 0, .09), m['stone'])
    for sx in (-1, 1):
        for sy in (-1, 1):
            o = box(f'leg{sx}{sy}', (.14, .14, 3.0), (sx * .62, sy * .62, 1.55), m['timber'], rot=(sy * .16, -sx * .16, 0))
    for h in (1.0, 2.0):
        for a in range(4):
            r = .62 - (h - 1) * .16
            box(f'brace{h}{a}', (1.4 - (h - 1) * .3, .1, .1), ((0, r, h + .4) if a % 2 == 0 else (r, 0, h + .4)), m['timber'], rot=(0, 0, 0 if a % 2 == 0 else math.pi / 2))
    cylinder('wheel', .45, .12, (0, 0, 3.05), m['steel'], 28, rot=(0, math.pi / 2, 0))
    box('engine-house', (1.2, 1.0, 1.0), (.9, -.9, .68), m['red'])
    gable_roof('engine-roof', 1.2, 1.0, 1.18, .35, m['tin'])
    windows('ew', 1.2, 1.0, .55, .5, 1, m['glass'], m['white'])
    export('drill')

def warehouse():
    reset(); m = materials()
    box('plinth', (4.9, 4.9, .25), (0, 0, .125), m['stone'])
    box('hall', (4.6, 4.0, 2.0), (0, 0, 1.25), m['red'])
    gable_roof('roof', 4.6, 4.0, 2.25, 1.3, m['slate'])
    for x in (-1.6, 0, 1.6):
        box(f'door{x}', (1.0, .06, 1.4), (x, -2.02, .95), m['white'])
        box(f'doorpanel{x}', (.86, .07, 1.28), (x, -2.03, .91), m['red'])
    windows('w', 4.6, 4.0, 1.5, .55, 4, m['glass'], m['white'], side_y=False)
    box('loft-door', (.7, .06, .8), (0, -2.02, 2.75), m['white'])
    cylinder('hoist', .05, 1.0, (0, -2.4, 3.2), m['steel'], 12, rot=(math.pi / 2, 0, 0))
    export('warehouse')

def lighthouse():
    reset(); m = materials()
    red = flat_material('lighthouse-red', (.66, .08, .07, 1), .55); white = flat_material('lighthouse-white', (.93, .93, .9, 1), .5)
    cylinder('base', 1.35, .5, (0, 0, .25), m['stone'], 40)
    for i in range(6):
        r0 = 1.05 - i * .1
        bpy.ops.mesh.primitive_cone_add(radius1=r0, radius2=r0 - .1, depth=1.0, location=(0, 0, .5 + i + .5), vertices=40)
        o = bpy.context.object; o.name = f'band{i}'; uv_box(o); o.data.materials.append(red if i % 2 == 0 else white)
    cylinder('gallery', .78, .12, (0, 0, 6.56), m['steel'], 40)
    cylinder('lantern', .45, .9, (0, 0, 7.07), m['lamp'], 24)
    bpy.ops.mesh.primitive_cone_add(radius1=.55, radius2=.05, depth=.55, location=(0, 0, 7.8), vertices=24)
    o = bpy.context.object; o.name = 'cap'; uv_box(o); o.data.materials.append(red)
    box('keeper-house', (1.8, 1.3, 1.1), (1.7, .9, .55), m['white'])
    gable_roof('keeper-roof', 1.8, 1.3, 1.1, .55, red)
    export('lighthouse')

def creatures():
    source = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'docs', 'design', 'coastal-creatures.blend')
    for kind, name in [('runner', 'runner.body.crab'), ('guard', 'guard.body.crab'), ('drowned', 'drowned.body.horror-monster'), ('walker', 'walker.body.horror-monster')]:
        bpy.ops.wm.open_mainfile(filepath=source)
        keep = bpy.data.objects[name]
        for o in list(bpy.data.objects):
            if o != keep: bpy.data.objects.remove(o, do_unlink=True)
        keep.select_set(True); bpy.context.view_layer.objects.active = keep
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'creature-{kind}.glb'), export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88)

def nature():
    # CC0 Poly Haven nature and harbour props, decimated to game budgets for instancing.
    budget = {'fir_sapling': 9000, 'pine_sapling_small': 6000, 'rock_moss_set_01': 6000, 'fern_02': 3000, 'wooden_crate_01': 2000,
              'wooden_barrels_01': 4000, 'boulder_01': 4000, 'tree_stump_01': 3000, 'shrub_04': 4000}
    for pid, target in budget.items():
        reset()
        bpy.ops.import_scene.gltf(filepath=os.path.join(CACHE, 'models', pid, pid + '.gltf'))
        for o in [o for o in bpy.data.objects if o.type == 'MESH']:
            faces = len(o.data.polygons)
            if faces > target:
                mod = o.modifiers.new('budget', 'DECIMATE'); mod.ratio = max(.01, target / faces)
                bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='budget')
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'nature-' + pid + '.glb'), export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)

smelter(); drill(); warehouse(); lighthouse(); creatures(); nature()
print('BUILT', sorted(os.listdir(OUT)))
