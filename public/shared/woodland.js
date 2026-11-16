// Cache a small distance field per target tile. Every hostile can use the same field.
export const BUILD_EDGE=38;
export const MAP_SIZE=(BUILD_EDGE+2)*2;
export const SWARM_SPAWN_EDGE=BUILD_EDGE+8;
const EDGE=SWARM_SPAWN_EDGE+1, WIDTH=EDGE*2+1, CELLS=WIDTH*WIDTH;
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
const cache=new WeakMap();
const index=(x,z)=>(z+EDGE)*WIDTH+x+EDGE;
const inside=(x,z)=>Math.abs(x)<=EDGE&&Math.abs(z)<=EDGE;
const blocked=(forest,x,z)=>!inside(x,z)||forest.tiles[index(x,z)]!==0;

export function woodland(terrain){
 let forest=cache.get(terrain);
 if(!forest||forest.trees!==terrain.trees||forest.count!==terrain.trees.length){
  const tiles=new Uint8Array(CELLS);
  for(const {x,z} of terrain.trees)if(inside(x,z))tiles[index(x,z)]=1;
  forest={trees:terrain.trees,count:terrain.trees.length,tiles,fields:new Map()};
  cache.set(terrain,forest);
 }
 return forest;
}
export const onTree=(forest,x,z)=>blocked(forest,Math.round(x),Math.round(z));

function canCross(forest,x,z,nx,nz){
 return !blocked(forest,nx,nz)&&(x===nx||z===nz||!blocked(forest,x,nz)&&!blocked(forest,nx,z));
}
function straightPath(forest,x,z,tx,tz){
 const dx=Math.abs(tx-x),dz=Math.abs(tz-z),sx=Math.sign(tx-x),sz=Math.sign(tz-z);
 let error=dx-dz;
 while(x!==tx||z!==tz){
  const twice=2*error;
  let nx=x,nz=z;
  if(twice>-dz){error-=dz;nx+=sx;}
  if(twice<dx){error+=dx;nz+=sz;}
  if(!canCross(forest,x,z,nx,nz))return false;
  x=nx;z=nz;
 }
 return true;
}
function distanceField(forest,tx,tz){
 const origin=index(tx,tz);
 if(forest.fields.has(origin))return forest.fields.get(origin);
 const distance=new Int16Array(CELLS).fill(-1),queue=new Int16Array(CELLS);
 distance[origin]=0;queue[0]=origin;
 for(let head=0,tail=1;head<tail;head++){
  const current=queue[head],x=current%WIDTH-EDGE,z=Math.floor(current/WIDTH)-EDGE;
  for(const [dx,dz] of directions){
   const nx=x+dx,nz=z+dz,neighbor=index(nx,nz);
   if(blocked(forest,nx,nz)||distance[neighbor]!==-1)continue;
   distance[neighbor]=distance[current]+1;queue[tail++]=neighbor;
  }
 }
 if(forest.fields.size>=8)forest.fields.delete(forest.fields.keys().next().value);
 forest.fields.set(origin,distance);
 return distance;
}
function stepToward(x,z,tx,tz,move,out){
 const fraction=Math.min(1,move/(Math.hypot(tx-x,tz-z)||1));
 out.x=x+(tx-x)*fraction;out.z=z+(tz-z)*fraction;
 return out;
}
export function walkAroundTrees(forest,enemy,target,move,out){
 const x=Math.round(enemy.x),z=Math.round(enemy.z),tx=Math.round(target.x),tz=Math.round(target.z);
 if(blocked(forest,x,z)){
  // Saves from before grove collision can contain hostiles standing on a tree tile.
  for(let radius=1;radius<=WIDTH;radius++)for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dz))===radius&&!blocked(forest,x+dx,z+dz))return stepToward(x+dx,z+dz,x+dx,z+dz,0,out);
  }
  return stepToward(enemy.x,enemy.z,enemy.x,enemy.z,0,out);
 }
 if(straightPath(forest,x,z,tx,tz)){
  stepToward(enemy.x,enemy.z,target.x,target.z,move,out);
  if(canCross(forest,x,z,Math.round(out.x),Math.round(out.z)))return out;
 }
 if(!blocked(forest,tx,tz)){
  const field=distanceField(forest,tx,tz),current=field[index(x,z)];
  if(current>0)for(const [dx,dz] of directions){
   const nx=x+dx,nz=z+dz;
   if(!blocked(forest,nx,nz)&&field[index(nx,nz)]===current-1)return stepToward(enemy.x,enemy.z,nx,nz,move,out);
  }
 }
 return stepToward(enemy.x,enemy.z,enemy.x,enemy.z,0,out);
}
