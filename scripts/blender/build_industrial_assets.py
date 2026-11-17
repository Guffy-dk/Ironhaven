"""Author detailed coastal workshops for the approved brick/steel art direction."""
import bpy, math, json, runpy
from pathlib import Path
helper=Path(__file__).with_name('build_coastal_assets.py')
g=runpy.run_path(str(helper));ROOT=g['ROOT'];g['COLORS'].update({'brick':(.61,.43,.3),'concrete':(.5,.48,.42),'roof':(.3,.34,.35),'steel':(.24,.28,.27),'glass':(.1,.17,.18),'timber':(.38,.26,.14),'warm':(.75,.43,.13)})
# Functions from run_path retain their shared globals dictionary.
g=g['ell'].__globals__
def box(color,p,s,bevel=.004):
 bpy.ops.mesh.primitive_cube_add(size=1,location=g['coord'](p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Worn edges','BEVEL');mod.width=min(bevel,min(s)*.2);mod.segments=2
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return g['finish'](o,color)
def rod(color,a,b,r):return g['tube'](color,[a,b],[r,r])
def window(x,y,z,w=.14,h=.19):
 box('steel',(x,y,z),(w+.025,h+.027,.024));box('glass',(x,y,z+.015),(w,h,.008))
 for xx in [-w/2,0,w/2]:box('steel',(x+xx,y,z+.023),(.007,h,.01),.001)
 box('steel',(x,y,z+.023),(w,.006,.01),.001);box('concrete',(x,y-h*.57,z+.015),(w+.04,.019,.045))
def roof(width,depth,y,pitch=.36):
 for side in [-1,1]:
  panel=box('roof',(0,y,side*depth*.252),(width+.085,.028,depth*.57));panel.rotation_euler.x=side*pitch
  for i in range(13):
   x=(i-6)*width/12
   seam=box('steel',(x,y+.016,side*depth*.252),(.008,.009,depth*.57),.001);seam.rotation_euler.x=side*pitch
 rod('steel',(-width*.56,y-.044,depth*.53),(width*.56,y-.044,depth*.53),.012)
 rod('steel',(-width*.56,y-.044,-depth*.53),(width*.56,y-.044,-depth*.53),.012)
 box('steel',(0,y+depth*.09,0),(width+.1,.019,.032))
def workshop(kind):
 g['CURRENT']='body';w=.84;d=.73;height=.67 if kind=='foundry' else .6
 box('concrete',(0,.07,0),(.96,.14,.9))
 box('brick',(0,.14+height*.5,0),(w,height,d),.006)
 # Bond lines on corners and reinforcing lintels break up the shell at normal zoom.
 for row in range(8):
  y=.18+row*height/8
  for side in [-1,1]:box('concrete',(side*w*.49,y,d*.5+.004),(.025,.009,.015),.001)
 box('concrete',(0,.17,0),(.87,.06,.77))
 roof(w,d,height+.22)
 # Factory clerestory is glazed on all four sides beneath a second metal roof.
 box('steel',(0,height+.27,0),(.67,.16,.23));roof(.68,.27,height+.4,.19)
 for x in [-.24,-.12,0,.12,.24]:window(x,height+.275,.125,.1,.105)
 # Large sliding loading door, runners and a recessed warm furnace opening.
 box('steel',(.07,.36,d/2+.013),(.34,.4,.025))
 box('warm',(.14,.34,d/2+.027),(.15,.25,.009))
 box('roof',(-.02,.36,d/2+.047),(.23,.37,.018))
 for xx in [-.12,-.02,.08]:box('steel',(xx,.36,d/2+.06),(.008,.35,.012),.001)
 rod('steel',(-.17,.59,d/2+.06),(.29,.59,d/2+.06),.01)
 for x in [-.32,.32]:window(x,.47,d/2+.008,.13,.21)
 # Windows on rear facade remain readable from camera pans.
 for x in [-.26,0,.26]:window(x,.47,-d/2-.026,.15,.2)
 # Service annex, duct bends, rainwater downpipe, control boxes and door handle.
 box('roof',(-.435,.33,-.06),(.055,.31,.18))
 rod('steel',(-.45,.24,-.05),(-.45,.79,-.05),.035)
 rod('steel',(-.45,.79,-.05),(-.31,.79,-.05),.035)
 for y in [.25,.45,.65]:box('steel',(-.476,y,-.05),(.012,.015,.075),.001)
 rod('steel',(.405,.16,.4),(.405,height+.17,.4),.012)
 box('steel',(.31,.27,.395),(.09,.13,.026));box('warm',(.31,.29,.414),(.025,.009,.005),.001)
 # Concrete loading apron, canopy and a small railed stair.
 box('concrete',(0,.09,.47),(.88,.18,.2))
 for i in range(3):box('concrete',(-.25,.025+i*.024,.66-i*.035),(.23,.05+i*.045,.07))
 for side in [-1,1]:
  for z in [.4,.59]:rod('steel',(side*.41,.19,z),(side*.41,.38,z),.006)
  rod('steel',(side*.41,.38,.4),(side*.41,.38,.59),.006)
 canopy=box('roof',(.22,.64,.49),(.48,.025,.28));canopy.rotation_euler.x=.11
 for x in [.02,.42]:rod('steel',(x,.19,.61),(x,.62,.61),.012)
 # Chimneys distinguish furnace buildings from clean assembly workshops.
 if kind in ['smelter','foundry']:
  for x,h in ([(-.24,1.3),(.23,1.12)] if kind=='foundry' else [(-.24,1.3)]):
   box('brick',(x,h*.5,-.17),(.13,h,.13));box('steel',(x,h,-.17),(.16,.034,.16))
   for y in [.95,1.11]:box('steel',(x,y,-.17),(.137,.012,.137),.001)
 elif kind!='storage':
  box('steel',(.25,height+.43,-.16),(.18,.1,.15))
  for x in [.19,.22,.25,.28,.31]:box('roof',(x,height+.487,-.16),(.009,.008,.12),.001)
 if kind=='storage':
  for x,z in [(-.27,.48),(.28,-.43)]:
   for i in range(3):box('timber',(x,.14+i*.025,z),(.18,.018,.14))
   box('timber',(x,.25,z),(.17,.14,.13))
   for xx in [x-.055,x+.055]:box('steel',(xx,.25,z+.069),(.009,.14,.005),.001)
 if kind=='circuitLab':
  for x in [-.12,0,.12]:box('glass',(x,height+.495,-.15),(.09,.009,.18))
 if kind=='componentFactory':
  rod('steel',(.45,.19,-.28),(.45,.65,-.28),.048);box('steel',(.35,.74,-.28),(.2,.12,.12))
 bpy.context.view_layer.update()
 objects=g['PARTS']['body'];categories={}
 for obj in objects:categories.setdefault(obj['palette'],[]).append(obj)
 return {name:g['export_part'](parts) for name,parts in categories.items()}
payload={'format':1,'generator':'Blender '+bpy.app.version_string,'buildings':{}}
for kind in ['smelter','foundry','assembler','circuitLab','componentFactory','storage']:
 g['PARTS']={'body':[]};payload['buildings'][kind]=workshop(kind)
 for obj in g['PARTS']['body']:obj.name=kind+'.'+obj.name
 print('Workshop',kind,flush=True)
(ROOT/'public/art/coastal-buildings.json').write_text(json.dumps(payload,separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/design/coastal-workshops.blend'),compress=True)
