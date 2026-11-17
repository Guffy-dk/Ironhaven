"""UV-preserving CC0 anatomical bases. Imported by build_coastal_assets.py.
Original files and digest receipts: docs/design/third-party-assets.json.
Download verified originals to work/asset-candidates before regeneration.
"""
import hashlib
SOURCES={'crab':('crab-crab.glb','6aebb245bc9faf7934dd44af26b2303d0021692ff2f680cd4105c6001cb7a77f'), 'horror':('horror-monster-horror-monster.glb','b5249c165b9fdbf2d17be8ff847b9c2f2f1eb4f7d23382bec5be8bf8a4100d5e')}
def apply_anatomy(env,kind):
 bpy=env['bpy'];parts=env['PARTS'];root=env['ROOT'];Vector=env['Vector']
 if kind not in ['runner','guard','drowned','walker']:return
 source='crab' if kind in ['runner','guard'] else 'horror';filename,digest=SOURCES[source];path=root/'work/asset-candidates'/filename
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,'Source asset digest mismatch'
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path));objects=[o for o in bpy.data.objects if o not in before and o.type=='MESH'];obj=objects[0]
 bpy.context.view_layer.objects.active=obj
 # Apply imported world transform before anatomical selection and LOD generation.
 for v in obj.data.vertices:v.co=obj.matrix_world@v.co
 obj.matrix_world.identity()
 # Extract original UV-matched PBR maps; never reproject these as planar textures.
 bs=obj.data.materials[0].node_tree.nodes.get('Principled BSDF')
 for slot,suffix in [('Base Color','color'),('Normal','normal')]:
  node=bs.inputs[slot].links[0].from_node if bs.inputs[slot].is_linked else None
  if node and node.type=='NORMAL_MAP':node=node.inputs['Color'].links[0].from_node
  if node and node.type=='SEPARATE_COLOR':node=node.inputs['Color'].links[0].from_node
  if node and node.type=='TEX_IMAGE':
   image=node.image.copy();image.scale(2048,2048);image.filepath_raw=str(root/f'public/art/{source}-{suffix}.png');image.file_format='PNG';image.save();bpy.data.images.remove(image)
 # Crop only concealed anatomy. The Drowned wears the authored oilskin coat;
 # the walker keeps its four marine stilt legs rather than human feet.
 if kind in ['drowned','walker']:
  import bmesh
  bm=bmesh.new();bm.from_mesh(obj.data)
  remove=[v for v in bm.verts if v.co.z<1.79] if kind=='drowned' else [v for v in bm.verts if v.co.z<1.06 and abs(v.co.x)<.28]
  bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(obj.data);bm.free()
 if source=='crab':
  scale=8.0 if kind=='guard' else 4.7
  for v in obj.data.vertices:v.co*=scale
  discard=list(parts)
 elif kind=='drowned':
  for v in obj.data.vertices:v.co=Vector((v.co.x*.43,v.co.y*.43,(v.co.z-1.79)*.43+.75))
  discard=[]
 else:
  for v in obj.data.vertices:v.co=Vector((v.co.x*.68,v.co.y*.8,(v.co.z-1.06)*.68+1.18))
  discard=['arms','forearms']
 for part in discard:
  for old in parts[part]:bpy.data.objects.remove(old,do_unlink=True)
  parts[part]=[]
 if kind=='drowned':
  for old in list(parts['body']):
   if old.get('palette') in ['skin','pale','dark']:parts['body'].remove(old);bpy.data.objects.remove(old,do_unlink=True)
 if kind=='walker':
  for old in list(parts['body']):
   if old.get('palette') not in ['kelp','rust']:parts['body'].remove(old);bpy.data.objects.remove(old,do_unlink=True)
 # Preserve surface contours, UV seams and original anatomical folds at runtime.
 mod=obj.modifiers.new('Near anatomical LOD','DECIMATE');mod.ratio=.09 if source=='crab' else .13
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
 obj['palette']='source-'+source;obj['source_asset']=source
 for face in obj.data.polygons:face.use_smooth=True
 parts['body'].append(obj)
 env['CURRENT']='body'
 # Asymmetric encrustation breaks up the natural crab silhouette.
 if source=='crab':
  env['barnacles']((0,.53 if kind=='guard' else .31,-.04),.29 if kind=='guard' else .16,65 if kind=='guard' else 15)
  for i in range(7 if kind=='guard' else 2):env['kelp']((-.24+i*.065,.48,-.08),(-.28+i*.07,.16,-.25),.004)
 else:
  if kind=='walker':env['barnacles']((0,1.81,-.015),.21,40)
