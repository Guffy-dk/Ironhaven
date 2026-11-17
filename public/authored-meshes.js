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
 const buffer=new T.InterleavedBuffer(new Float32Array(bytes(payload.data).buffer),11),geometry=new T.BufferGeometry();
 for(const [name,size,offset] of [['position',3,0],['normal',3,3],['color',3,6],['uv',2,9]])geometry.setAttribute(name,new T.InterleavedBufferAttribute(buffer,size,offset));
 geometry.setIndex(new T.BufferAttribute(new Uint32Array(bytes(payload.indices).buffer),1));
 geometry.userData.authoredBy=generator;geometry.computeBoundingSphere();return geometry;
}
