// One coastal surface definition shared by placement, terrain and creature elevation.
export function coastDistance(terrain,x,z){
 const c=terrain?.coast;if(!c)return 1000;
 if(c.kind==='island'){
  const dx=(x-c.x)/c.rx,dz=(z-c.z)/c.rz,a=Math.atan2(dz,dx);
  const edge=1+.035*Math.sin(a*5+c.seed)+.022*Math.cos(a*9-c.seed);
  return (edge-Math.hypot(dx,dz))*Math.min(c.rx,c.rz);
 }
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

// New islands are opt-in world generation; saved headlands keep their original coast.
export function establishIsland(state){
 const terrain=state.terrain,seed=(state.seed%997)*.01;
 terrain.coast={kind:'island',x:0,z:0,rx:168,rz:156,seed};
 const core=state.buildings.find(b=>b.type==='hq');core.x=0;core.z=0;core.islandBeacon=true;core.lighthouseAuto=true;
 const occupied=new Set();
 const deposit=(name,cx,cz,r)=>{for(let x=cx-r;x<=cx+r;x++)for(let z=cz-r;z<=cz+r;z++){
  const key=x+','+z;if((x-cx)**2+(z-cz)**2>r*r+1||occupied.has(key)||!coastalLand(terrain,x,z,5))continue;
  terrain[name].push({x,z});occupied.add(key);
 }};
 for(const name of ['ore','copper','coal'])terrain[name]=[];
 deposit('ore',8,9,4);deposit('ore',-20,-11,5);deposit('copper',21,-15,5);deposit('coal',-21,20,5);
 for(let ring=0;ring<3;ring++)for(let i=0;i<10;i++){
  const angle=i*Math.PI/5+ring*.31+seed*.1,r=52+ring*38;
  deposit(['ore','copper','coal'][(i+ring)%3],Math.round(Math.sin(angle)*r),Math.round(Math.cos(angle)*r),5+(i%3===0?2:0));
 }
 for(const name of ['trees','rocks'])terrain[name]=terrain[name].filter(p=>coastalLand(terrain,p.x,p.z,4)&&!occupied.has(p.x+','+p.z)&&Math.hypot(p.x,p.z)>30);
 // Keep the tutorial sawmill grove; open corridors separate the outer groves.
 for(let x=14;x<=17;x++)for(let z=1;z<=6;z++)if((x+z)%3)terrain.trees.push({x,z,h:1.3});
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8+seed*.1,cx=Math.round(Math.sin(a)*141),cz=Math.round(Math.cos(a)*132);
  for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
   const x=cx+dx,z=cz+dz;if(dx*dx+dz*dz>10||!coastalLand(terrain,x,z,6)||occupied.has(x+','+z))continue;
   if(!terrain.trees.some(t=>t.x===x&&t.z===z))terrain.trees.push({x,z,h:1.15+.2*Math.sin(x+z)});
  }
 }
}
export function islandLanding(terrain,heading,offshore=2){
 let lo=0,hi=150;const dx=Math.sin(heading),dz=Math.cos(heading);
 for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(coastDistance(terrain,dx*mid,dz*mid)>0)lo=mid;else hi=mid;}
 return {x:dx*(hi+offshore),z:dz*(hi+offshore)};
}
export const COAST_ISLAND_GLSL=`float islandDistance(vec2 p,vec4 island,float seed){vec2 q=(p-island.xy)/island.zw;float a=atan(q.y,q.x);return (1.+.035*sin(a*5.+seed)+.022*cos(a*9.-seed)-length(q))*min(island.z,island.w);}`;
