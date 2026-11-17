const names={ore:'IRON',copper:'COPPER',coal:'COAL'};
export function mineralFields(terrain){
 const result=[];
 for(const [type,name]of Object.entries(names)){
  const pending=new Map((terrain[type]??[]).map(p=>[p.x+','+p.z,p]));
  while(pending.size){const first=pending.values().next().value,queue=[first];pending.delete(first.x+','+first.z);let x=0,z=0;
   for(let i=0;i<queue.length;i++){const p=queue[i];x+=p.x;z+=p.z;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=(p.x+dx)+','+(p.z+dz),next=pending.get(key);if(next){queue.push(next);pending.delete(key);}}}
   result.push({type,name,x:x/queue.length,z:z/queue.length,tiles:queue.length});
  }
 }
 return result;
}
