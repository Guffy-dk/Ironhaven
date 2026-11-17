// One coastal surface definition shared by placement, terrain and creature elevation.
export function coastDistance(terrain,x,z){
 const c=terrain?.coast;if(!c)return 1000;
 const dx=x-c.x,shore=c.shoreZ+Math.sin(dx*.09)*.5+Math.sin(dx*.21)*.18;
 const mainland=z-shore;
 const headland=(1-Math.hypot(dx/5,(z-(c.shoreZ-4))/7))*6+Math.sin(dx*1.37+z*.8)*.28+Math.sin(dx*2.6-z*1.7)*.13;
 return Math.max(mainland,headland);
}
export function coastalLand(terrain,x,z,margin=.35){return coastDistance(terrain,x,z)>=margin;}
export function coastalHeight(terrain,x,z){
 const d=coastDistance(terrain,x,z),t=Math.max(0,Math.min(1,(d+1.6)/1.9));
 if(t===1)return 0;
 return -.94*(1-t*t*(3-2*t));
}
export function actorElevation(terrain,x,z){return Math.max(-.29,coastalHeight(terrain,x,z));}
export function establishCoast(state){
 state.terrain.coast={x:0,shoreZ:-2};
 const core=state.buildings.find(b=>b.type==='hq');core.x=0;core.z=-8;
 for(const name of ['trees','rocks','ore','copper','coal'])state.terrain[name]=state.terrain[name].filter(p=>coastalLand(state.terrain,p.x,p.z,.9));
 state.terrain.trees=state.terrain.trees.filter(p=>Math.hypot(p.x,p.z+8)>2.1&&!(p.x>=-1&&p.x<=4&&p.z>=-8&&p.z<=1));
 for(const [x,z] of [[-2,-5],[-2,-6],[-3,-4]])if(coastalLand(state.terrain,x,z,1))state.terrain.trees.push({x,z,h:1.25});
 state.terrain.rocks=state.terrain.rocks.filter(p=>Math.hypot(p.x,p.z+8)>2.1&&!(p.x>=-1&&p.x<=4&&p.z>=-8&&p.z<=1));
}
