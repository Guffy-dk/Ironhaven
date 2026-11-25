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

def texture_material(name, surface, tint=(1, 1, 1, 1), scale=1.0, rough=None, metal=None):
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
    # Painted surfaces are dielectric even when the scan underneath is bare metal.
    if metal is None: nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    else: bsdf.inputs['Metallic'].default_value = metal
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

def gable_roof(name, width, depth, base, rise, mat, overhang=.12, gable=None):
    w, d = width / 2 + overhang, depth / 2 + overhang
    verts = [(-w, -d, base), (w, -d, base), (w, d, base), (-w, d, base), (0, -d, base + rise), (0, d, base + rise)]
    faces = [(0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4), (0, 3, 2, 1)]
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    me.materials.append(mat)
    if gable:
        # Gable ends carry the wall finish, not the roof covering.
        me.materials.append(gable); me.polygons[0].material_index = me.polygons[1].material_index = 1
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.06); bm.to_mesh(me); bm.free()
    uv_box(o, 1.6); return o

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

def bevel(o, w=.025, seg=2):
    m = o.modifiers.new('bevel', 'BEVEL'); m.width = w; m.segments = seg; m.limit_method = 'ANGLE'; return o

def bbox(name, size, loc, mat, rot=(0, 0, 0), w=.025):
    return bevel(box(name, size, loc, mat, rot), min(w, min(size) * .3))

def plinth(prefix, width, depth, height, mat, block=.55):
    # Dressed granite blocks with mortar gaps instead of one slab.
    for side in (-1, 1):
        for axis in ('x', 'y'):
            span = width if axis == 'x' else depth
            n = max(2, round(span / block))
            for i in range(n):
                c = -span / 2 + (i + .5) * span / n; l = span / n - .03
                loc = (c, side * depth / 2, height / 2) if axis == 'x' else (side * width / 2, c, height / 2)
                size = (l, .3, height) if axis == 'x' else (.3, l, height)
                bbox(f'{prefix}-{axis}{side}{i}', size, loc, mat, w=.04)
    box(f'{prefix}-core', (width - .3, depth - .3, height - .02), (0, 0, height / 2), mat)

def clad(prefix, width, depth, z0, height, wall, batten, step=.3):
    # Board-and-batten timber walls: a solid wall plus raised battens every `step`.
    bbox(f'{prefix}-wall', (width, depth, height), (0, 0, z0 + height / 2), wall, w=.015)
    for side in (-1, 1):
        n = max(2, round(width / step))
        for i in range(1, n):
            x = -width / 2 + i * width / n
            box(f'{prefix}-bx{side}{i}', (.055, .04, height), (x, side * (depth / 2 + .02), z0 + height / 2), batten)
        n = max(2, round(depth / step))
        for i in range(1, n):
            y = -depth / 2 + i * depth / n
            box(f'{prefix}-by{side}{i}', (.04, .055, height), (side * (width / 2 + .02), y, z0 + height / 2), batten)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bbox(f'{prefix}-corner{sx}{sy}', (.12, .12, height + .02), (sx * width / 2, sy * depth / 2, z0 + height / 2), batten, w=.02)
    bbox(f'{prefix}-skirt', (width + .1, depth + .1, .14), (0, 0, z0 + .07), batten, w=.02)

def window(prefix, centre, axis, w, h, glass, trim, panes=(2, 2)):
    # Framed, glazing-barred, recessed window with a sill on a wall facing ±axis.
    x, y, z = centre; s = 1 if (y if axis == 'y' else x) > 0 else -1
    def put(name, size, off):
        dx, dz, out = off
        if axis == 'y': bbox(name, (size[0], size[2], size[1]), (x + dx, y + s * out, z + dz), trim, w=.01)
        else: bbox(name, (size[2], size[0], size[1]), (x + s * out, y + dx, z + dz), trim, w=.01)
    t = .07
    put(f'{prefix}-top', (w + .1, t * 1.4, .06), (0, h / 2 + t / 2, .03))
    put(f'{prefix}-sill', (w + .16, t, .1), (0, -h / 2 - t / 2, .05))
    put(f'{prefix}-l', (t, h, .05), (-w / 2, 0, .025)); put(f'{prefix}-r', (t, h, .05), (w / 2, 0, .025))
    for i in range(1, panes[0]): put(f'{prefix}-v{i}', (.025, h, .035), (-w / 2 + i * w / panes[0], 0, .01))
    for i in range(1, panes[1]): put(f'{prefix}-h{i}', (w, .025, .035), (0, -h / 2 + i * h / panes[1], .01))
    if axis == 'y': box(f'{prefix}-glass', (w, .02, h), (x, y - s * .01, z), glass)
    else: box(f'{prefix}-glass', (.02, w, h), (x - s * .01, y, z), glass)

def roof(prefix, width, depth, base, rise, cover, trim, overhang=.22, gable=None):
    gable_roof(prefix, width, depth, base, rise, cover, overhang, gable)
    half = width / 2 + overhang; slope = math.atan2(rise, half); length = math.hypot(half, rise)
    bbox(f'{prefix}-ridge', (.16, depth + 2 * overhang + .04, .1), (0, 0, base + rise + .04), trim, w=.02)
    for sy in (-1, 1):
        for sx in (-1, 1):
            bbox(f'{prefix}-barge{sx}{sy}', (length + .05, .05, .16), (sx * half / 2, sy * (depth / 2 + overhang + .02), base + rise / 2 - .02), trim, rot=(0, sx * slope, 0), w=.015)
    for sx in (-1, 1):
        bbox(f'{prefix}-fascia{sx}', (.05, depth + 2 * overhang, .14), (sx * half, 0, base - .03), trim, w=.015)
        cylinder(f'{prefix}-gutter{sx}', .055, depth + 2 * overhang, (sx * (half + .05), 0, base - .06), trim, 10, rot=(math.pi / 2, 0, 0))
        cylinder(f'{prefix}-down{sx}', .035, base - .1, (sx * (half + .05), depth / 2 + overhang - .1, (base - .1) / 2), trim, 10)

def level_marks(prefix, width, depth, base, rise, level, mat, overhang=.22, at=(0, 0)):
    # Painted bands across both roof slopes near the front gable: one band per level, countable at a glance.
    half = width / 2 + overhang; slope = math.atan2(rise, half); length = math.hypot(half, rise) * .8
    band, gap = (.16, .26) if depth > 1.5 else (.08, .14)
    for k in range(level):
        y = at[1] - depth / 2 + band + k * gap
        for sx in (-1, 1):
            n = (sx * math.sin(slope), math.cos(slope))
            box(f'{prefix}-mark{k}{sx}', (length, band, .02), (at[0] + sx * half / 2 + n[0] * .035, y, base + rise / 2 + n[1] * .035), mat, rot=(0, sx * slope, 0))

def chimney(prefix, at, w, top, brick, cap):
    x, y = at
    bbox(f'{prefix}-stack', (w, w, top), (x, y, top / 2), brick, w=.02)
    for k, z in enumerate((top - .45, top - .12)):
        bbox(f'{prefix}-band{k}', (w + .1, w + .1, .1), (x, y, z), brick, w=.02)
    cylinder(f'{prefix}-pot', w * .22, .3, (x, y, top + .15), cap, 16)

def materials():
    return {
        'red': texture_material('falu-red-timber', 'painted-wood', (0.55, 0.12, 0.08, 1), 1.1),
        'redboard': texture_material('falu-red-batten', 'painted-wood', (0.48, 0.1, 0.07, 1), 1.6),
        'ochre': texture_material('ochre-timber', 'painted-wood', (0.78, 0.55, 0.22, 1), 1.1),
        'white': texture_material('white-trim', 'painted-wood', (0.62, 0.6, 0.55, 1), 1.8),
        'brick': texture_material('harbour-brick', 'brick', scale=.9),
        'slate': texture_material('slate-roof', 'slate-roof', (0.42, 0.45, 0.5, 1), .9),
        'tin': texture_material('corrugated-roof', 'corrugated-iron', (0.62, 0.64, 0.64, 1), 1.0),
        # Type colours read from above (owner, 25 Nov 2026): every factory type has its own roof.
        'charcoal': texture_material('charcoal-slate', 'slate-roof', (0.09, 0.095, 0.11, 1), .9),
        'greentin': texture_material('green-tin', 'corrugated-iron', (0.2, 0.32, 0.24, 1), 1.0, metal=0),
        'bluetin': texture_material('blue-tin', 'corrugated-iron', (0.28, 0.36, 0.44, 1), 1.0, metal=0),
        # Level bands are worn paint: still the brightest thing on a roof, but carrying the scan's grime.
        'mark': texture_material('level-paint', 'concrete', (0.95, 0.92, 0.84, 1), 1.5),
        'mineyellow': texture_material('mine-yellow', 'concrete', (0.86, 0.6, 0.1, 1), 1.4),
        'plate': texture_material('galvanised-plate', 'steel-plate', (0.55, 0.57, 0.58, 1), 1.3),
        'motorgrey': texture_material('motor-grey', 'concrete', (0.22, 0.24, 0.26, 1), 1.6),
        'silo': texture_material('silo-grey', 'concrete', (0.5, 0.52, 0.53, 1), 1.2),
        'chrome': flat_material('ram-chrome', (0.8, 0.8, 0.8, 1), .15, 1.0),
        'rubber': flat_material('hose-rubber', (0.03, 0.03, 0.03, 1), .7),
        'stone': texture_material('granite-plinth', 'terrain-granite', (0.7, 0.68, 0.66, 1), .8),
        'timber': texture_material('tarred-timber', 'timber', (0.5, 0.42, 0.34, 1), 1.4),
        'steel': texture_material('painted-steel', 'steel-plate', (0.32, 0.36, 0.37, 1), 1.2),
        'rust': texture_material('rusted-iron', 'rust', scale=1.2),
        'concrete': texture_material('lime-render', 'concrete', (0.58, 0.57, 0.54, 1), .8),
        'redrender': flat_material('red-render', (0.5, 0.06, 0.04, 1), .6),
        'glass': flat_material('window-glass', (0.05, 0.07, 0.08, 1), .05, .2),
        'lit': flat_material('lamplit-glass', (0.08, 0.07, 0.05, 1), .1, 0, ((1.0, .62, .3, 1), .7)),
        'furnace': flat_material('furnace-glow', (0.2, 0.05, 0.01, 1), .6, 0, ((1.0, .32, .06, 1), 4)),
        'lamp': flat_material('lantern', (1, .93, .78, 1), .2, 0, ((1, .9, .65, 1), 8)),
    }

def smelter(level=1):
    # Brick smelting house (3x3 tiles): charcoal slate roof, corbelled stack, glowing furnace mouth, ore hopper.
    # Level 2 adds a furnace annex; level 3 a second stack and a covered ore gantry.
    reset(); m = materials()
    plinth('plinth', 2.8, 2.4, .3, m['stone'])
    bbox('hall', (2.5, 2.1, 1.45), (0, 0, 1.02), m['brick'], w=.02)
    for sx in (-1, 1):
        for sy in (-1, 1): bbox(f'pier{sx}{sy}', (.2, .2, 1.5), (sx * 1.25, sy * 1.05, 1.03), m['brick'], w=.02)
    bbox('string', (2.62, 2.22, .08), (0, 0, 1.72), m['stone'], w=.02)
    roof('roof', 2.5, 2.1, 1.76, .78, m['charcoal'], m['white'], .2, m['brick'])
    level_marks('roof', 2.5, 2.1, 1.76, .78, level, m['mark'], .2)
    chimney('stack', (.7, .45), .42, 4.2, m['brick'], m['steel'])
    # Furnace mouth: brick arch surround, iron door frame and a hot opening.
    bbox('arch', (.9, .14, 1.05), (0, -1.09, .82), m['brick'], w=.03)
    box('mouth', (.56, .06, .55), (0, -1.15, .68), m['furnace'])
    bbox('lintel', (.8, .18, .1), (0, -1.14, 1.0), m['rust'], w=.02)
    for x in (-.32, .32): bbox(f'jamb{x}', (.08, .18, .62), (x, -1.14, .68), m['rust'], w=.015)
    for i, x in enumerate((-.85, .85)): window(f'wf{i}', (x, -1.06, 1.15), 'y', .42, .55, m['lit'], m['white'])
    for i, x in enumerate((-.7, 0, .7)): window(f'wb{i}', (x, 1.06, 1.15), 'y', .42, .55, m['glass'], m['white'])
    # Ore hopper on legs feeding the side wall.
    bevel(box('hopper', (.7, .7, .5), (-1.6, 0, 1.55), m['rust']), .02)
    bpy.ops.mesh.primitive_cone_add(radius1=.48, radius2=.14, depth=.45, vertices=4, location=(-1.6, 0, 1.08), rotation=(math.pi, 0, math.pi / 4))
    o = bpy.context.object; uv_box(o); o.data.materials.append(m['rust'])
    for sx in (-1, 1):
        for sy in (-1, 1): bbox(f'hleg{sx}{sy}', (.07, .07, 1.3), (-1.6 + sx * .3, sy * .3, .65), m['steel'], w=.01)
    bbox('chute', (.5, .18, .14), (-1.3, 0, .95), m['steel'], rot=(0, -.5, 0), w=.01)
    if level >= 2:
        bbox('annex', (.8, 1.7, 1.0), (1.6, 0, .8), m['brick'], w=.02)
        bbox('annex-roof', (1.0, 1.9, .08), (1.65, 0, 1.38), m['charcoal'], rot=(0, -.35, 0), w=.02)
        box('annex-glow', (.06, .6, .4), (2.01, 0, .7), m['furnace'])
        for y in (-.45, .45): bbox(f'annex-jamb{y}', (.1, .08, .55), (2.02, y * .75, .7), m['rust'], w=.01)
    if level >= 3:
        chimney('stack2', (-.7, .45), .42, 4.8, m['brick'], m['steel'])
        bbox('gantry', (.5, 1.8, .4), (-1.6, -1.4, 1.95), m['steel'], rot=(.55, 0, 0), w=.02)
        for sy in (-1, 1): bbox(f'gantry-leg{sy}', (.08, .08, 2.0), (-1.6 + sy * .2, -2.1, 1.0), m['steel'], w=.01)
    export(f'smelter-{level}')

def drill(level=1):
    # Ore drill rig (3x3 tiles), a low heavy machine sitting on the deposit (owner, 25 Nov 2026: "towers as drills look
    # wrong"): concrete pad, steel skid and deck with handrails, mining-yellow drill housing with motor, gearbox and drill
    # rod into the ground, hydraulic ram, operator cab, and an ore hopper with a chute towards +x (the belt side).
    # Level 2 adds a second motor and a dust duct; level 3 a dust-collector silo. Level bands are worn paint on the cab roof.
    reset(); m = materials(); y = m['mineyellow']; st = m['steel']
    bbox('pad', (2.8, 2.8, .22), (0, 0, .11), m['concrete'], w=.03)
    box('bore', (.7, .7, .02), (-.3, .2, .225), flat_material('bore-dark', (.03, .025, .02, 1), .95))
    for sx in (-1, 1): bbox(f'skid{sx}', (.22, 2.5, .2), (sx * .95, 0, .32), st, w=.02)
    for k in (-1, 0, 1): bbox(f'cross{k}', (2.1, .16, .14), (0, k * 1.0, .33), st, w=.015)
    bbox('deck', (2.3, 2.3, .07), (0, 0, .45), m['plate'], w=.01)
    # Drill unit: rod, collar, housing with flanges and bolts, gearbox, motor with cooling fins.
    cx, cy = -.3, .2
    cylinder('rod', .1, .9, (cx, cy, .2), st, 16)
    cylinder('collar', .3, .12, (cx, cy, .52), st, 24)
    cylinder('housing', .42, 1.0, (cx, cy, 1.0), y, 32)
    for z in (.52, 1.5): cylinder(f'flange{z}', .48, .07, (cx, cy, z), y, 32)
    for k in range(14):
        a = k * math.tau / 14
        for z in (.57, 1.55): cylinder(f'bolt{k}{z}', .025, .05, (cx + .45 * math.cos(a), cy + .45 * math.sin(a), z), st, 6)
    bbox('gearbox', (.7, .55, .32), (cx, cy, 1.7), y, w=.03)
    cylinder('motor', .26, .55, (cx + .05, cy, 2.13), m['motorgrey'], 24)
    for k in range(12):
        a = k * math.tau / 12
        box(f'fin{k}', (.04, .1, .48), (cx + .05 + .29 * math.cos(a), cy + .29 * math.sin(a), 2.13), m['motorgrey'], rot=(0, 0, a))
    cylinder('fan-cap', .2, .08, (cx + .05, cy, 2.44), st, 20)
    # Hydraulic ram braced from the deck to the gearbox.
    cylinder('ram', .06, 1.3, (cx + .55, cy - .45, 1.1), m['chrome'], 12, rot=(.35, -.35, 0))
    cylinder('ram-body', .09, .7, (cx + .68, cy - .6, .8), y, 12, rot=(.35, -.35, 0))
    cylinder('hose', .03, 1.2, (cx + .4, cy + .45, 1.05), m['rubber'], 8, rot=(-.4, .2, 0))
    # Operator cab.
    bbox('cab', (.72, .62, .7), (.62, .72, .83), y, w=.03)
    bbox('cab-roof', (.82, .72, .06), (.62, .72, 1.21), m['plate'], w=.01)
    box('cab-window', (.6, .02, .38), (.62, .405, .92), m['glass'])
    box('cab-side', (.02, .45, .34), (.985, .72, .92), m['glass'])
    for k in range(level): box(f'level{k}', (.7, .09, .012), (.62, .5 + k * .15, 1.245), m['mark'])
    # Ore hopper and discharge chute on the +x side.
    bpy.ops.mesh.primitive_cone_add(radius1=.55, radius2=.18, depth=.55, vertices=4, location=(.65, -.55, .95), rotation=(math.pi, 0, math.pi / 4))
    o = bpy.context.object; o.name = 'hopper'; uv_box(o); o.data.materials.append(m['rust'])
    bbox('hopper-rim', (.8, .8, .08), (.65, -.55, 1.24), y, w=.01)
    bbox('chute', (.9, .32, .06), (1.15, -.55, .62), m['rust'], rot=(0, .42, 0), w=.01)
    for sx in (-1, 1): bbox(f'chute-side{sx}', (.9, .03, .12), (1.15, -.55 + sx * .16, .67), m['rust'], rot=(0, .42, 0), w=.005)
    # Walkway handrails along the open edges.
    for k in range(6):
        x = -1.1 + k * .44
        cylinder(f'post-s{k}', .02, .55, (x, -1.12, .75), y, 6)
    bbox('rail-s', (2.25, .04, .04), (0, -1.12, 1.02), y, w=.01); bbox('rail-s2', (2.25, .03, .03), (0, -1.12, .78), y, w=.01)
    for k in range(4):
        cylinder(f'post-w{k}', .02, .55, (-1.12, -1.1 + k * .5, .75), y, 6)
    bbox('rail-w', (.04, 1.6, .04), (-1.12, -.35, 1.02), y, w=.01)
    bbox('ladder', (.32, .05, .45), (0, -1.3, .25), st, rot=(.35, 0, 0), w=.01)
    if level >= 2:
        cylinder('motor2', .2, .45, (.15, -.2, .75), m['motorgrey'], 20, rot=(0, math.pi / 2, 0))
        bbox('motor2-base', (.55, .4, .1), (.15, -.2, .52), st, w=.01)
        cylinder('duct', .1, 1.4, (-.9, .3, 1.3), m['silo'], 12)
        cylinder('duct-elbow', .1, .7, (-.62, .2, 1.98), m['silo'], 12, rot=(0, math.pi / 2, .3))
    if level >= 3:
        cylinder('silo', .36, 1.3, (-.85, -.6, 1.45), m['silo'], 24)
        bpy.ops.mesh.primitive_cone_add(radius1=.36, radius2=.08, depth=.45, vertices=24, location=(-.85, -.6, .6), rotation=(math.pi, 0, 0))
        o = bpy.context.object; uv_box(o); o.data.materials.append(m['silo'])
        for sx in (-1, 1):
            for sy in (-1, 1): bbox(f'silo-leg{sx}{sy}', (.05, .05, .9), (-.85 + sx * .27, -.6 + sy * .27, .9), st, w=.005)
        for k in range(level): cylinder(f'silo-band{k}', .37, .06, (-.85, -.6, 2.0 - k * .14), m['mark'], 24)
    export(f'drill-{level}')

def warehouse(level=1):
    # Falu-red board-and-batten harbour store (5x5 tiles) under green tin: white Z-braced doors, loft hoist, loading dock.
    # Level 2 adds a lean-to shed; level 3 a second shed and a jib crane on the dock.
    reset(); m = materials()
    plinth('plinth', 4.7, 4.1, .35, m['stone'])
    clad('hall', 4.5, 3.9, .35, 1.95, m['red'], m['redboard'])
    roof('roof', 4.5, 3.9, 2.3, 1.35, m['greentin'], m['white'], gable=m['redboard'])
    level_marks('roof', 4.5, 3.9, 2.3, 1.35, level, m['mark'])
    for i, x in enumerate((-1.5, 1.5)):
        y = -1.98
        bbox(f'door{i}', (1.0, .06, 1.45), (x, y - .02, 1.1), m['redboard'], w=.01)
        for k, (zz, w) in enumerate(((.42, 1.08), (1.1, 1.08), (1.78, 1.08))): bbox(f'door{i}rail{k}', (w, .05, .1), (x, y - .06, zz), m['white'], w=.01)
        for sx in (-1, 1): bbox(f'door{i}st{sx}', (.09, .05, 1.5), (x + sx * .52, y - .06, 1.1), m['white'], w=.01)
        bbox(f'door{i}brace', (.08, .05, 1.0), (x, y - .07, 1.1), m['white'], rot=(0, .78, 0), w=.01)
    window('wmid', (0, -1.98, 1.45), 'y', .55, .6, m['lit'], m['white'])
    for i, x in enumerate((-1.4, 0, 1.4)): window(f'wb{i}', (x, 1.98, 1.35), 'y', .55, .6, m['glass'], m['white'])
    for i, y in enumerate((-.9, .9)):
        for sx in (-1, 1): window(f'ws{i}{sx}', (sx * 2.28, y, 1.35), 'x', .55, .6, m['glass'], m['white'])
    bbox('loft', (.75, .06, .85), (0, -1.99, 2.95), m['redboard'], w=.01)
    for sx in (-1, 1): bbox(f'loft{sx}', (.08, .06, .95), (sx * .42, -2.02, 2.95), m['white'], w=.01)
    bbox('hoist', (.12, 1.0, .12), (0, -2.45, 3.62), m['timber'], w=.01)
    cylinder('hoist-rope', .012, 1.6, (0, -2.88, 2.8), m['timber'], 6)
    bbox('dock', (4.7, .9, .32), (0, -2.55, .16), m['timber'], w=.02)
    for i in range(10): box(f'deck{i}', (.43, .92, .03), (-2.12 + i * .47, -2.55, .33), m['timber'])
    for k, sx in enumerate((1, -1)[:max(0, level - 1)]):
        bbox(f'shed{k}', (.9, 3.2, 1.3), (sx * 2.75, .2, .65), m['red'], w=.02)
        bbox(f'shed{k}-roof', (1.15, 3.4, .07), (sx * 2.8, .2, 1.42), m['greentin'], rot=(0, sx * .32, 0), w=.02)
        bbox(f'shed{k}-door', (.06, 1.0, 1.0), (sx * 3.21, .2, .6), m['white'], w=.01)
    if level >= 3:
        cylinder('jib-mast', .08, 3.2, (1.9, -2.7, 1.6), m['steel'], 12)
        bbox('jib-arm', (.1, 1.7, .12), (1.9, -3.35, 3.0), m['steel'], rot=(-.25, 0, 0), w=.01)
        cylinder('jib-rope', .012, 1.4, (1.9, -4.1, 2.4), m['steel'], 6)
    export(f'warehouse-{level}')

def lighthouse():
    # Rendered masonry tower in red and white bands with a gallery rail, glazed lantern, copper-green cap and keeper's cottage.
    reset(); m = materials(); m['concrete'] = flat_material('lighthouse-white', (0.8, 0.79, 0.75, 1), .6)
    plinth('base', 2.6, 2.6, .5, m['stone'])
    for i in range(6):
        r0 = 1.0 - i * .09
        bpy.ops.mesh.primitive_cone_add(radius1=r0, radius2=r0 - .09, depth=1.0, location=(0, 0, .5 + i + .5), vertices=48)
        o = bpy.context.object; o.name = f'band{i}'; uv_box(o); o.data.materials.append(m['redrender'] if i % 2 == 0 else m['concrete'])
    for i, z in enumerate((2.1, 4.1)):
        window(f'tw{i}', (0, -(1.0 - .09 * (z - .5)) - .02, z), 'y', .22, .4, m['lit'], m['white'], (1, 2))
    cylinder('gallery', .85, .12, (0, 0, 6.56), m['steel'], 48)
    for k in range(20):
        a = k * math.tau / 20; cylinder(f'post{k}', .018, .5, (.8 * math.cos(a), .8 * math.sin(a), 6.85), m['steel'], 6)
    bpy.ops.mesh.primitive_torus_add(major_radius=.8, minor_radius=.025, location=(0, 0, 7.1)); o = bpy.context.object; uv_box(o); o.data.materials.append(m['steel'])
    cylinder('lantern', .42, .9, (0, 0, 7.07), m['lamp'], 24)
    for k in range(8):
        a = k * math.tau / 8; bbox(f'mullion{k}', (.04, .04, .92), (.44 * math.cos(a), .44 * math.sin(a), 7.07), m['steel'], w=.01)
    copper = flat_material('verdigris', (.32, .52, .45, 1), .55, .3)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.52, location=(0, 0, 7.5), segments=32, ring_count=12); o = bpy.context.object
    o.scale.z = .7; uv_box(o); o.data.materials.append(copper)
    cylinder('vent', .08, .3, (0, 0, 7.95), copper, 12)
    # Keeper's cottage.
    def cottage(o): o.location.x += 2.3; o.location.y += 1.2
    before = set(bpy.data.objects)
    plinth('cplinth', 2.0, 1.5, .25, m['stone'])
    clad('cottage', 1.9, 1.4, .25, 1.05, m['concrete'], m['white'], .22)
    roof('croof', 1.9, 1.4, 1.3, .6, m['slate'], m['white'], .16, m['concrete'])
    window('cw', (0, -.71, .85), 'y', .38, .42, m['lit'], m['white'])
    chimney('cstack', (.5, .2), .26, 2.15, m['brick'], m['steel'])
    for o in set(bpy.data.objects) - before: cottage(o)
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

def conifer(pid, cards_per_tree=2600, card_size=(.7, 1.15)):
    # Game-ready conifer from a scanned tree whose needles are millions of real triangles (unusable in a
    # game, and decimation erases them). Bake a real needle spray from the scan to an alpha card, then grow
    # cards along the scanned twig surface; bark, trunk and dead branches keep their scanned geometry.
    import numpy as np, random
    reset(); random.seed(7)
    bpy.ops.import_scene.gltf(filepath=os.path.join(CACHE, 'models', pid, pid + '.gltf'))
    for o in [o for o in bpy.data.objects if o.type == 'MESH']:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.mesh.separate(type='MATERIAL')
    twigs = [o for o in bpy.data.objects if o.type == 'MESH' and 'twig' in o.active_material.name]
    # 1. Bake: orthographic top view of a branch tip from the scan, transparent film.
    src = max(twigs, key=lambda o: len(o.data.polygons))
    n = len(src.data.polygons); centres = np.empty(n * 3, 'f4'); src.data.polygons.foreach_get('center', centres); centres = centres.reshape(n, 3)
    world = np.array(src.matrix_world); centres = centres @ world[:3, :3].T + world[:3, 3]
    z = centres[:, 2]; h = z.max(); r = np.hypot(centres[:, 0] - centres[:, 0].mean(), centres[:, 1] - centres[:, 1].mean())
    band = (z > h * .35) & (z < h * .6); pick = centres[band][np.argsort(r[band])[int(band.sum() * .8)]]
    for o in bpy.data.objects:
        if o.type == 'MESH': o.hide_render = o is not src
    # Bake albedo, not lighting: dense needles shade each other black. Emission of the base colour, cut by alpha.
    tw = src.active_material.node_tree; pb = next(nd for nd in tw.nodes if nd.type == 'BSDF_PRINCIPLED'); outn = next(nd for nd in tw.nodes if nd.type == 'OUTPUT_MATERIAL')
    emit = tw.nodes.new('ShaderNodeEmission'); clear = tw.nodes.new('ShaderNodeBsdfTransparent'); mixn = tw.nodes.new('ShaderNodeMixShader')
    if pb.inputs['Base Color'].links: tw.links.new(pb.inputs['Base Color'].links[0].from_socket, emit.inputs['Color'])
    else: emit.inputs['Color'].default_value = pb.inputs['Base Color'].default_value
    if pb.inputs['Alpha'].links: tw.links.new(pb.inputs['Alpha'].links[0].from_socket, mixn.inputs['Fac'])
    else: mixn.inputs['Fac'].default_value = 1
    tw.links.new(clear.outputs[0], mixn.inputs[1]); tw.links.new(emit.outputs[0], mixn.inputs[2]); tw.links.new(mixn.outputs[0], outn.inputs['Surface'])
    cam_data = bpy.data.cameras.new('bake'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = 1.3; cam_data.clip_start = .01; cam_data.clip_end = 1.4
    cam = bpy.data.objects.new('bake', cam_data); bpy.context.collection.objects.link(cam); cam.location = (pick[0], pick[1], pick[2] + .7)
    sc = bpy.context.scene; sc.camera = cam; sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = 512; sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('bake'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.1
    card_png = os.path.join(OUT, f'{pid}-needles.png'); sc.render.filepath = card_png; sc.render.image_settings.color_mode = 'RGBA'
    bpy.ops.render.render(write_still=True)
    # The albedo bake reads pale once lit from the sky; darken and enrich to a living spruce green.
    shot = bpy.data.images.load(card_png); px = np.empty(len(shot.pixels), 'f4'); shot.pixels.foreach_get(px); px = px.reshape(-1, 4)
    grey = px[:, :3].mean(axis=1, keepdims=True); px[:, :3] = np.clip((grey + (px[:, :3] - grey) * 1.35) * .62, 0, 1)
    shot.pixels.foreach_set(px.ravel()); shot.filepath_raw = card_png; shot.file_format = 'PNG'; shot.save(); bpy.data.images.remove(shot)
    # 2. Cards on the scanned twig surface, area-weighted, facing between the surface normal and the sky.
    img = bpy.data.images.load(card_png); img.alpha_mode = 'STRAIGHT'
    mat = bpy.data.materials.new(f'{pid}-needles'); mat.use_nodes = True; nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = .8; mat.blend_method = 'CLIP'; mat.use_backface_culling = False
    for t in twigs:
        m = len(t.data.polygons); c = np.empty(m * 3, 'f4'); nrm = np.empty(m * 3, 'f4'); area = np.empty(m, 'f4')
        t.data.polygons.foreach_get('center', c); t.data.polygons.foreach_get('normal', nrm); t.data.polygons.foreach_get('area', area)
        c = c.reshape(m, 3); nrm = nrm.reshape(m, 3)
        chosen = np.random.default_rng(11).choice(m, size=min(cards_per_tree, m), replace=False, p=area / area.sum())
        verts, faces, uvs = [], [], []
        for k, i in enumerate(chosen):
            up = np.array([0, 0, 1.]); nn = nrm[i] * (1 if nrm[i][2] >= 0 else -1); axis = nn * .5 + up * .5; axis /= np.linalg.norm(axis)
            a = np.cross(axis, [1, 0, 0] if abs(axis[0]) < .9 else [0, 1, 0]); a /= np.linalg.norm(a); b = np.cross(axis, a)
            spin = random.uniform(0, math.tau); u = a * math.cos(spin) + b * math.sin(spin); v = np.cross(axis, u)
            half = random.uniform(*card_size) / 2; o = c[i]
            base = len(verts)
            for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)): verts.append(tuple(o + (su * u + sv * v) * half))
            faces.append((base, base + 1, base + 2, base + 3)); uvs += [(0, 0), (1, 0), (1, 1), (0, 1)]
        me = bpy.data.meshes.new(t.name + '-cards'); me.from_pydata(verts, [], faces); me.update()
        layer = me.uv_layers.new(); [setattr(layer.data[i], 'uv', uv) for i, uv in enumerate(uvs)]
        me.materials.append(mat)
        cards = bpy.data.objects.new(t.name.split('.')[0] + '_cards', me); cards.matrix_world = t.matrix_world.copy()
        cards.parent = t.parent; cards.matrix_parent_inverse = t.matrix_parent_inverse.copy(); bpy.context.collection.objects.link(cards)
        bpy.data.objects.remove(t, do_unlink=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    for o in [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.endswith('_cards')]:
        o.hide_render = False
        if len(o.data.polygons) > 6000:
            mod = o.modifiers.new('budget', 'DECIMATE'); mod.ratio = 6000 / len(o.data.polygons)
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='budget')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'nature-' + pid + '.glb'), export_format='GLB', export_image_format='AUTO')

def fir(): conifer('fir_tree_01')

def nature():
    # CC0 Poly Haven nature and harbour props, decimated to game budgets for instancing.
    budget = {'fir_sapling': 9000, 'pine_sapling_small': 6000, 'rock_moss_set_01': 6000, 'fern_02': 3000, 'wooden_crate_01': 2000,
              'wooden_barrels_01': 4000, 'boulder_01': 4000, 'tree_stump_01': 3000, 'shrub_04': 4000,
              # Full-size scanned trees, coast rock and the harbour kit (owner: "no toy art", 25 Nov 2026).
              'coast_rocks_01': 8000, 'coast_rocks_02': 8000, 'coast_land_rocks_02': 8000,
              'modular_wooden_pier': 30000, 'modular_factory_facade': 40000, 'modular_industrial_pipes_01': 20000,
              'overhead_crane': 20000, 'modular_electricity_poles': 12000, 'ship_pinnace': 30000, 'dutch_ship_medium': 40000,
              'lateral_sea_marker': 4000, 'ocean_buoy': 4000, 'shrub_02': 4000, 'street_lamp_01': 4000,
              'rollershutter_door': 4000, 'metal_jerrycan': 1500, 'propane_tank': 2000, 'modular_metal_gutter': 4000}
    for pid, target in budget.items():
        reset()
        bpy.ops.import_scene.gltf(filepath=os.path.join(CACHE, 'models', pid, pid + '.gltf'))
        for o in [o for o in bpy.data.objects if o.type == 'MESH']:
            faces = len(o.data.polygons)
            if faces > target:
                mod = o.modifiers.new('budget', 'DECIMATE'); mod.ratio = max(.01, target / faces)
                bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='budget')
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'nature-' + pid + '.glb'), export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)

only = set(argv[2:])
def levels():
    for builder in (smelter, drill, warehouse):
        for level in (1, 2, 3): builder(level)

for step in (levels, lighthouse, creatures, nature, fir):
    if not only or step.__name__ in only: step()
print('BUILT', sorted(os.listdir(OUT)))
