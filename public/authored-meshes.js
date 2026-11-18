import * as T from './vendor/three.module.js';
import coastal from './art/coastal-meshes.json' with {type:'json'};
const cache=new Map();
function bytes(base64){const raw=atob(base64),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
export function authoredHostile(kind,part,low=false){
 const key=`${kind}:${part}:${low}`;
 if(cache.has(key))return cache.get(key);
 const payload=(low?coastal.species[kind]?.low:coastal.species[kind])?.[part];
 if(!payload)return null;
 const geometry=decodeMesh(payload,coastal.generator);cache.set(key,geometry);return geometry;
}

export function decodeMesh(payload,generator){
 const geometry=new T.BufferGeometry(),data=bytes(payload.data),n=payload.vertices;
 if(payload.packing==='p32n16c8uv32s8'){
  const uv=Math.ceil(21*n/4)*4,surface=uv+8*n;
  if(!Number.isInteger(n)||n<1||data.byteLength!==surface+n)throw Error('Invalid packed mesh size');
  geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(data.buffer,0,n*3),3));
  geometry.setAttribute('normal',new T.BufferAttribute(new Int16Array(data.buffer,12*n,n*3),3,true));
  geometry.setAttribute('color',new T.BufferAttribute(new Uint8Array(data.buffer,18*n,n*3),3,true));
  geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(data.buffer,uv,n*2),2));
  geometry.setAttribute('coastalSurface',new T.BufferAttribute(new Uint8Array(data.buffer,surface,n),1));
 }else{
  const buffer=new T.InterleavedBuffer(new Float32Array(data.buffer),payload.stride||11);
  for(const [name,size,offset] of [['position',3,0],['normal',3,3],['color',3,6],['uv',2,9]])geometry.setAttribute(name,new T.InterleavedBufferAttribute(buffer,size,offset));
  if(payload.stride===12)geometry.setAttribute('coastalSurface',new T.InterleavedBufferAttribute(buffer,1,11));
 }
 const index=bytes(payload.indices);geometry.setIndex(new T.BufferAttribute(payload.indexType==='u16'?new Uint16Array(index.buffer):new Uint32Array(index.buffer),1));
 geometry.userData.authoredBy=generator;geometry.computeBoundingSphere();return geometry;
}
