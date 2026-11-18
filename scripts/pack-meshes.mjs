// Lossless positions/UVs and topology; normalized normals/colors use GPU-native integers.
import {readFile,writeFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
export function packMesh(payload){
 if(payload.packing)return payload;
 const stride=payload.stride??11,source=Buffer.from(payload.data,'base64'),n=source.length/(stride*4);if(!Number.isInteger(n)||n<1)throw Error('Invalid source vertex buffer');
 const normal=12*n,color=18*n,uv=Math.ceil(21*n/4)*4,surface=uv+8*n,bytes=Buffer.alloc(surface+n),indices=Buffer.from(payload.indices,'base64');
 for(let i=0;i<n;i++){
  for(let axis=0;axis<3;axis++){bytes.writeFloatLE(source.readFloatLE((i*stride+axis)*4),i*12+axis*4);bytes.writeInt16LE(Math.floor(Math.max(-1,Math.min(1,source.readFloatLE((i*stride+3+axis)*4)))*32767+.5),normal+i*6+axis*2);bytes[color+i*3+axis]=Math.floor(Math.max(0,Math.min(1,source.readFloatLE((i*stride+6+axis)*4)))*255+.5);}
  for(let axis=0;axis<2;axis++)bytes.writeFloatLE(source.readFloatLE((i*stride+9+axis)*4),uv+i*8+axis*4);
  bytes[surface+i]=stride===12?Math.round(source.readFloatLE((i*stride+11)*4)):0;
 }
 const small=n<=65536,packedIndex=small?Buffer.alloc(indices.length/2):indices;
 for(let i=0;i<indices.length/4;i++){const index=indices.readUInt32LE(i*4);if(index>=n)throw Error('Index outside vertex buffer');if(small)packedIndex.writeUInt16LE(index,i*2);}
 return {packing:'p32n16c8uv32s8',vertices:n,indexType:small?'u16':'u32',indices:packedIndex.toString('base64'),data:bytes.toString('base64')};
}
export function packDocument(doc){function visit(value){if(value&&typeof value==='object'){if(value.data&&value.indices)return packMesh(value);for(const key of Object.keys(value))value[key]=visit(value[key]);}return value;}visit(doc);doc.format=2;return doc;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)for(const file of process.argv.slice(2)){const raw=await readFile(file,'utf8'),packed=JSON.stringify(packDocument(JSON.parse(raw)));await writeFile(file,packed);console.log(`${file}: ${Buffer.byteLength(raw)} → ${Buffer.byteLength(packed)} bytes`);}
