"""Headless Blender 4.3 authoring/export for Ironhaven's coastal creature rigs.
Run: blender -b --factory-startup --python scripts/blender/build_coastal_assets.py
Coordinates in the helpers are game coordinates: X right, Y up, Z forward.
The packed mesh payload keeps the shipped Windows game self contained.
"""
import bpy, math, random, json, base64, struct
from pathlib import Path
from mathutils import Vector
from mathutils.noise import noise
ROOT=Path(__file__).resolve().parents[2]
random.seed(1871)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
MATS={}; PARTS={}; CURRENT=None
COLORS={'shell':(0.22,.17,.105),'ridge':(.34,.27,.16),'bone':(.53,.49,.36),'dark':(.035,.052,.045),'skin':(.38,.43,.37),'pale':(.6,.63,.53),'coat':(.07,.12,.145),'seam':(.15,.19,.17),'rust':(.22,.15,.085),'kelp':(.12,.16,.065),'eye':(.65,.59,.39)}
def coord(p):return Vector((p[0],-p[2],p[1]))
def material(name):
 if name not in MATS:
  m=bpy.data.materials.new(name);m.diffuse_color=(*COLORS[name],1);m.use_nodes=True
  bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*COLORS[name],1);bs.inputs['Roughness'].default_value=.8 if name=='coat' else .48
  MATS[name]=m
 return MATS[name]
def finish(o,color,rough=False):
 o.data.materials.append(material(color));o['palette']=color
 for face in o.data.polygons:face.use_smooth=True
 if rough:
  tex=bpy.data.textures.get('surface-grain') or bpy.data.textures.new('surface-grain',type='CLOUDS');tex.noise_scale=.07;tex.noise_depth=2
  mod=o.modifiers.new('Sculpted irregularity','DISPLACE');mod.texture=tex;mod.strength=.013;mod.mid_level=.5;mod.texture_coords='GLOBAL'
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 PARTS[CURRENT].append(o);return o

def ell(color,p,s,rough=False):
 detail=8 if max(s)<.035 else 12 if max(s)<.07 else 24
 bpy.ops.mesh.primitive_uv_sphere_add(segments=detail,ring_count=max(6,detail//2),location=coord(p));o=bpy.context.object
 o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,color,rough)
def tube(color,points,radii,sides=10):
 verts=[];faces=[]
 for i,p in enumerate(points):
  axis=coord(points[min(i+1,len(points)-1)])-coord(points[max(0,i-1)])
  axis.normalize();u=axis.cross(Vector((0,0,1)))
  if u.length<.01:u=axis.cross(Vector((0,1,0)))
  u.normalize();v=axis.cross(u).normalized()
  for k in range(sides):
   a=k*2*math.pi/sides;verts.append(coord(p)+(u*math.cos(a)+v*math.sin(a))*radii[i])
 for i in range(len(points)-1):
  for k in range(sides):faces.append((i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k))
 faces.append(tuple(range(sides-1,-1,-1)));faces.append(tuple((len(points)-1)*sides+k for k in range(sides)))
 mesh=bpy.data.meshes.new('Tapered organic tube');mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new('Anatomical segment',mesh);bpy.context.collection.objects.link(o);return finish(o,color)
def ring(color,p,major,minor,rotation=None):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=12,minor_segments=5,location=coord(p));o=bpy.context.object
 if rotation:o.rotation_euler=rotation
 return finish(o,color)
def fuse_organic(objects,voxel=.009):
 if len(objects)<2:return
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();obj=objects[0]
 for part in PARTS.values():part[:]=[item for item in part if item not in objects[1:]]
 mod=obj.modifiers.new('Continuous sculpted anatomy','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True
 bpy.ops.object.modifier_apply(modifier=mod.name)
 smooth=obj.modifiers.new('Anatomical transitions','SMOOTH');smooth.factor=.7;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
 for poly in obj.data.polygons:poly.use_smooth=True

def barnacles(center,radius,count):
 clusters=[(-.37,.22),(.24,-.24),(.05,.04),(.37,.29)]
 for i in range(count):
  cx,cz=clusters[i%len(clusters)];a=i*2.399963;r=radius*(.1+random.random()*.3)
  x=center[0]+cx*radius+math.cos(a)*r;z=center[2]+cz*radius+math.sin(a)*r
  distance=math.hypot(x-center[0],z-center[2]);y=center[1]-.065*(distance/max(radius,.001))**2
  scale=.009+random.random()*.022
  bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=scale,radius2=scale*.57,depth=scale*1.2,end_fill_type='NOTHING',location=coord((x,y,z)))
  obj=bpy.context.object;obj.rotation_euler.x=(random.random()-.5)*.5;obj.rotation_euler.y=(random.random()-.5)*.5;finish(obj,'bone')
  ell('dark',(x,y-scale*.25,z),(scale*.5,.002,scale*.5))
def kelp(a,b,thickness=.006):
 points=[]
 for i in range(8):
  t=i/7;points.append((a[0]*(1-t)+b[0]*t+math.sin(t*7)*thickness*3,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t+math.sin(t*9)*.014))
 tube('kelp',points,[thickness*(1-i/9) for i in range(8)],6)
def crab(kind):
 global CURRENT
 guard=kind=='guard';r=.44 if guard else .25;h=.32 if guard else .18
 CURRENT='body'
 ell('shell',(0,h,0),(r,.17 if guard else .105,r*.88),True)
 ell('dark',(0,h-.075,.035),(r*.82,.07,r*.76))
 # Overlapping sculpted chitin plates, radial ridges and irregular edge spines.
 for i in range(6):
  z=(i-2.5)*r*.27;width=r*(.9-abs(i-2.5)*.1)
  ell('ridge' if i%2 else 'shell',(0,h+.06+math.cos(i*.9)*.014,z),(width,.045,r*.21),True)
 for side in [-1,1]:
  CURRENT='body'
  for i in range(7):
   z=(i-3)*r*.22
   tube('ridge',[(side*r*.77,h+.05,z),(side*r*1.02,h+.095,z-.02),(side*r*1.1,h+.035,z-.04)],[.022,.014,.002])
  tube('shell',[(side*r*.44,h,.13),(side*r*.56,h+.09,r*.71)],[.02,.012])
  ell('dark',(side*r*.56,h+.09,r*.71),(.021,.023,.022))
  # A pincer with open jaws, knuckle joints and individual serrations.
  x=side*r*.92
  CURRENT='clawLeft' if side<0 else 'clawRight'
  tube('ridge',[(side*r*.72,h-.05,.15),(x,h-.01,r*.88),(x,h-.02,r*1.12)],[.037 if guard else .021,.05 if guard else .026,.035 if guard else .021])
  ell('shell',(x,h-.025,r*1.14),(r*.27,r*.19,r*.27),True)
  for jaw in [-1,1]:
   tube('bone',[(x+jaw*r*.13,h-.025,r*1.25),(x+jaw*r*.17,h-.025,r*1.45),(x+jaw*r*.035,h-.025,r*1.6)],[r*.13,r*.08,.003])
   for tooth in range(3):ell('bone',(x+jaw*r*.105,h-.025,r*(1.3+tooth*.07)),(.009,.009,.009))
 CURRENT='body'
 ell('dark',(0,h-.07,r*.64),(r*.27,.055,.06))
 for side in [-1,1]:tube('bone',[(side*r*.23,h-.08,r*.55),(side*r*.12,h-.12,r*.77),(side*r*.035,h-.075,r*.85)],[.022,.017,.003])
 barnacles((0,h+.16 if guard else h+.1,0),r*.77,48 if guard else 18)
 for i in range(5 if guard else 2):kelp(((-.5+i*.24)*r,h+.09,-r*.3),((-.6+i*.22)*r,h-.13,-r*.5))
 CURRENT='limbs';length=.47 if guard else .3
 tube('shell',[(0,0,0),(.11,.06,.005),(.19,.09,.025)],[.033,.028,.023])
 CURRENT='lowerLimbs'
 tube('shell',[(.19,.09,.025),(.3,-h*.35,.06),(length,-h+.04,.08)],[.024,.017,.003])
 ell('ridge',(.18,.085,.023),(.033,.035,.029),True)
 for i in range(3):ell('ridge',(.09+i*.025,.065+i*.006,.01),(.017,.032,.032))

def drowned():
 global CURRENT
 CURRENT='body'
 ell('coat',(0,.48,0),(.145,.235,.105),True)
 # Oilskin coat skirt, front lapels, belt, seams and hanging fabric folds.
 for side in [-1,1]:
  ell('coat',(side*.068,.31,.01),(.095,.115,.12),True)
  tube('seam',[(side*.13,.65,.04),(side*.12,.53,.098),(side*.1,.33,.11),(side*.13,.23,.08)],[.008]*4)
  ell('coat',(side*.075,.57,.107),(.05,.08,.013))
  for i in range(3):tube('seam',[(side*(.03+i*.036),.37,.105),(side*(.04+i*.035),.25,.115)],[.004,.002],6)
 tube('rust',[(-.13,.4,.065),(0,.39,.12),(.13,.4,.065)],[.012]*3)
 for i in range(5):ell('bone',(.01,.43+i*.045,.11),(.006,.006,.004))
 ell('skin',(0,.73,.03),(.045,.07,.045),True)
 ell('pale',(0,.805,.05),(.072,.103,.067),True)
 ell('skin',(0,.756,.075),(.057,.041,.052))
 for side in [-1,1]:
  ell('dark',(side*.033,.823,.107),(.022,.018,.012))
  ell('skin',(side*.033,.843,.108),(.029,.014,.013))
  ell('pale',(side*.073,.806,.035),(.013,.029,.019))
 ell('skin',(0,.803,.12),(.013,.037,.025));ell('dark',(0,.765,.117),(.029,.006,.008))
 fuse_organic([obj for obj in PARTS['body'] if obj.get('palette') in ['skin','pale']],.004)
 ell('coat',(0,.888,.028),(.084,.027,.083));ell('coat',(0,.87,.053),(.102,.012,.086))
 for i in range(8):
  x=(i-3.5)*.025;kelp((x,.67,-.064),(x+math.sin(i)*.03,.28+(i%3)*.035,-.125),.005)
 CURRENT='limbs'
 tube('coat',[(0,0,0),(.01,-.14,.015),(.015,-.19,.015)],[.046,.043,.037])
 CURRENT='lowerLimbs'
 tube('coat',[(.015,-.19,.015),(.02,-.24,.025),(0,-.32,.04)],[.037,.034,.027])
 for i in range(3):ell('seam',(.014,-.17+i*.015,.025),(.045,.009,.042))
 ell('dark',(0,-.33,.064),(.041,.039,.079))
 for i in range(3):ell('rust',(0,-.355+i*.007,.085),(.043,.003,.056))
 CURRENT='arms'
 tube('coat',[(0,0,0),(.015,-.12,.035),(.027,-.19,.08)],[.045,.04,.03])
 CURRENT='forearms'
 tube('coat',[(.027,-.19,.08),(.03,-.28,.12)],[.03,.021])
 for i in range(3):ell('seam',(.025,-.17+i*.015,.07),(.034,.009,.036))
 ell('pale',(.03,-.3,.135),(.027,.039,.022),True)
 for i in range(4):tube('skin',[(.011+i*.013,-.315,.147),(.009+i*.014,-.355,.158),(.008+i*.014,-.367,.17)],[.006,.005,.002],8)
 tube('skin',[(.008,-.295,.14),(-.007,-.321,.16),(-.002,-.335,.17)],[.008,.006,.003],8)

def spitter():
 global CURRENT
 CURRENT='body'
 anatomy=[]
 anatomy.append(ell('skin',(0,.23,-.075),(.25,.2,.43),True));anatomy.append(ell('pale',(0,.44,.24),(.13,.28,.15),True))
 anatomy.append(ell('skin',(0,.69,.34),(.125,.092,.135),True))
 anatomy.append(ell('pale',(0,.45,.367),(.155,.195,.13),True));fuse_organic(anatomy,.009)
 for side in [-1,1]:
  ell('dark',(side*.076,.726,.418),(.009,.009,.007))
  tube('skin',[(side*.12,.3,.1),(side*.09,.5,.29),(side*.07,.61,.41)],[.012,.01,.005])
  for i in range(7):
   x=side*(.015+i*.008)
   tube('rust',[(x,.68,.462),(side*(.1+i*.007),.66,.5+i*.005)],[.0017,.0005],5)

 for side in [-1,1]:ell('dark',(side*.009,.698,.466),(.004,.009,.004))
 tube('dark',[(-.046,.668,.46),(0,.66,.474),(.046,.668,.46)],[.002,.003,.002],6)
 for i in range(12):
  x=(i-5.5)*.017;z=.388+math.sqrt(max(0,1-(x/.16)**2))*.09
  tube('skin',[(x*.4,.61,.414),(x,.48,z),(x*.7,.3,.38)],[.003,.004,.002],6)
 CURRENT='limbs';ell('skin',(.13,-.025,.06),(.2,.037,.1),True)
 for i in range(4):tube('pale',[(.14,-.025,.02+i*.023),(.31,-.038,.01+i*.025)],[.006,.002],6)

def walker():
 global CURRENT
 CURRENT='body'
 torso=[ell('shell',(0,1.47,0),(.26,.27,.19),True),ell('shell',(-.22,1.62,-.01),(.14,.13,.14),True),ell('shell',(.22,1.62,-.01),(.14,.13,.14),True),ell('shell',(0,1.78,.1),(.18,.15,.23),True)];fuse_organic(torso,.01)
 for i in range(6):
  y=1.29+i*.087
  for side in [-1,1]:tube('bone',[(0,y,.195),(side*.23,y+.035,.12),(side*.27,y+.055,-.04)],[.018,.024,.013])
 ell('dark',(0,1.815,.315),(.067,.047,.017));ell('eye',(0,1.819,.333),(.022,.026,.006))
 barnacles((0,1.82,-.03),.25,32)
 for i in range(15):
  x=(i-7)*.034;kelp((x,1.74,-.12),(x*1.3,.87+(i%4)*.055,-.21),.005)
 for i in range(5):tube('rust',[(-.24,1.58+i*.027,-.08),(0,1.55+i*.027,.24),(.24,1.58+i*.027,-.08)],[.005]*3,6)
 CURRENT='limbs'
 tube('shell',[(0,0,0),(.14,-.2,.012),(.26,-.52,.035)],[.047,.04,.031])
 CURRENT='lowerLimbs'
 tube('shell',[(.26,-.52,.035),(.34,-.9,.08),(.42,-1.25,.12)],[.031,.023,.006])
 ell('bone',(.26,-.52,.035),(.052,.057,.047),True)
 for i in range(4):ring('bone',(.27+i*.015,-.55-i*.09,.044+i*.01),.023,.005)
 CURRENT='arms'
 tube('shell',[(0,0,0),(.1,-.22,.03),(.13,-.48,.1)],[.034,.029,.023])
 CURRENT='forearms'
 tube('shell',[(.13,-.48,.1),(.17,-.91,.2)],[.023,.011])
 ell('bone',(.13,-.48,.1),(.036,.042,.034))
 for i in range(3):tube('bone',[(.17,-.89,.2),(.12+i*.047,-1.01,.23),(.1+i*.057,-1.07,.3)],[.01,.007,.002],8)

def export_part(objects,low=False,offset=(0,0,0)):
 floats=[];indices=[];lookup={}
 for obj in objects:
  context=bpy.context.evaluated_depsgraph_get()
  if low:
   mod=obj.modifiers.new('Runtime distance LOD','DECIMATE');mod.ratio=.065 if obj.get('palette','').startswith('source-') else .22
   context.update();evaluated=obj.evaluated_get(context);mesh=evaluated.to_mesh()
  else:mesh=obj.data
  mesh.calc_loop_triangles();normal_matrix=obj.matrix_world.to_3x3().inverted().transposed();base=COLORS.get(obj['palette'],(1,1,1))
  for tri in mesh.loop_triangles:
   for loop_index in tri.loops:
    loop=mesh.loops[loop_index];v=obj.matrix_world@mesh.vertices[loop.vertex_index].co
    normal=(normal_matrix@mesh.corner_normals[loop_index].vector).normalized()
    x,y,z=v.x,v.z,-v.y;nx,ny,nz=normal.x,normal.z,-normal.y
    variation=.9+.1*noise(Vector((x*35,y*35,z*35)))
    palette=obj['palette'];layer=2 if palette in ['coat','seam'] else 1 if palette in ['skin','pale'] else 3 if palette=='bone' else 4 if palette=='eye' else 0
    tint=(.86,.86,.86) if layer==2 else (.93,.95,.88) if layer==1 else (.9,.88,.8) if layer==3 else (.92,.87,.76)
    if palette.startswith('source-'):
     layer=5 if palette=='source-crab' else 6;tint=(1,1,1)
    if palette in ['dark','kelp']:tint=base
    if palette=='eye':tint=(.92,.81,.56)
    if palette in ['brick','concrete','roof','steel','glass','timber','warm']:tint=base
    # Vertex grain and dark seams retain their character at every graphics quality.
    uv=mesh.uv_layers.active.data[loop_index].uv if palette.startswith('source-') else (x*2+z,y*2+z)
    values=(x-offset[0],y-offset[1],z-offset[2],nx,ny,nz,*[min(1,c*variation) for c in tint],uv[0],uv[1],float(layer))
    key=tuple(round(v,6) for v in values)
    if key not in lookup:lookup[key]=len(floats)//12;floats.extend(values)
    indices.append(lookup[key])
  if low:evaluated.to_mesh_clear();obj.modifiers.remove(mod)
 return {'stride':12,'vertices':len(floats)//12,'indices':base64.b64encode(struct.pack('<%sI'%len(indices),*indices)).decode('ascii'),'data':base64.b64encode(struct.pack('<%sf'%len(floats),*floats)).decode('ascii')}

def main():
 global PARTS,CURRENT
 payload={'format':1,'generator':'Blender '+bpy.app.version_string,'species':{}}
 all_objects=[]
 for kind,fn in [('runner',lambda:crab('runner')),('drowned',drowned),('guard',lambda:crab('guard')),('spitter',spitter),('walker',walker)]:
  PARTS={'body':[],'limbs':[],'lowerLimbs':[],'arms':[],'forearms':[],'clawLeft':[],'clawRight':[]};fn()
  import runpy
  runpy.run_path(str(Path(__file__).with_name('source_anatomy.py')))['apply_anatomy'](globals(),kind)
  bpy.context.view_layer.update()
  offsets={'runner':{'lowerLimbs':(.19,.09,.025),'clawLeft':(-.25*.7,.18-.05,.15),'clawRight':(.25*.7,.18-.05,.15)},'guard':{'lowerLimbs':(.19,.09,.025),'clawLeft':(-.44*.7,.32-.05,.15),'clawRight':(.44*.7,.32-.05,.15)},'drowned':{'lowerLimbs':(.015,-.19,.015),'forearms':(.027,-.19,.08)},'walker':{'lowerLimbs':(.26,-.52,.035),'forearms':(.13,-.48,.1)}}.get(kind,{})
  payload['species'][kind]={part:export_part(objects,False,offsets.get(part,(0,0,0))) for part,objects in PARTS.items() if objects}
  payload['species'][kind]['low']={part:export_part(objects,True,offsets.get(part,(0,0,0))) for part,objects in PARTS.items() if objects}
  for part,objects in PARTS.items():
   for obj in objects:obj.name=f'{kind}.{part}.{obj.name}';obj['species']=kind;obj['rig_part']=part
   all_objects.extend(objects)
  print(kind, {part:p['vertices'] for part,p in payload['species'][kind].items() if part!='low'},flush=True)
 (ROOT/'public/art/coastal-meshes.json').write_text(json.dumps(payload,separators=(',',':')))
 import subprocess
 subprocess.run(['node',str(ROOT/'scripts/pack-meshes.mjs'),str(ROOT/'public/art/coastal-meshes.json')],check=True)
 # Retain an editable native Blender source, with named rig-part objects.
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/design/coastal-creatures.blend'),compress=True)
 print('Exported coastal species meshes and editable Blender source.',flush=True)

if __name__=='__main__':main()
