export const LAMP_RADIUS=6;
const EMPTY_FIELD={sourceAt(){return null;}};
// Spatial buckets keep local-light lookup bounded even in very large colonies.
export function lampField(buildings){
 const buckets=new Map();
 for(const b of buildings)if(b.type==='lamp'&&b.hp>0&&b.active){const k=Math.floor(b.x/LAMP_RADIUS)+','+Math.floor(b.z/LAMP_RADIUS);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(b);}
 if(!buckets.size)return EMPTY_FIELD;
 return {sourceAt(p){
  let source=null,closest=LAMP_RADIUS**2;const x=Math.floor(p.x/LAMP_RADIUS),z=Math.floor(p.z/LAMP_RADIUS);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const b of buckets.get((x+dx)+','+(z+dz))??[]){const d=(p.x-b.x)**2+(p.z-b.z)**2;if(d<=closest){closest=d;source=b;}}
  return source;
 }};
}
