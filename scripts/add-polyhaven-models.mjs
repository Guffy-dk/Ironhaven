// Adds Poly Haven CC0 models to assets/manifest.json with size and MD5 from the Poly Haven API.
// Usage: node scripts/add-polyhaven-models.mjs <resolution> <id> [id...]   (resolution: 1k, 2k, 4k)
// The game build never calls the API: fetch-assets.mjs downloads exactly what the manifest pins.
import {readFile,writeFile} from 'node:fs/promises';

export function manifestEntry(id,resolution,files){
 const gltf=files.gltf?.[resolution]?.gltf;
 if(!gltf)throw Error(`${id} has no ${resolution} glTF`);
 const entry={id,source:`https://polyhaven.com/a/${id}`,license:'CC0-1.0',author:'Poly Haven',kind:'model',files:{[`${id}.gltf`]:{url:gltf.url,size:gltf.size,md5:gltf.md5}}};
 for(const [name,file] of Object.entries(gltf.include??{}))entry.files[name]={url:file.url,size:file.size,md5:file.md5};
 return entry;
}

export function addEntries(manifest,entries){
 const known=new Set(manifest.assets.map(a=>a.id));
 return {...manifest,assets:[...manifest.assets,...entries.filter(e=>!known.has(e.id))]};
}

if(import.meta.url===`file://${process.argv[1]}`){
 const [resolution,...ids]=process.argv.slice(2);
 const manifest=JSON.parse(await readFile('assets/manifest.json','utf8'));
 const entries=[];
 for(const id of ids){
  const response=await fetch(`https://api.polyhaven.com/files/${id}`);
  if(!response.ok)throw Error(`${id}: HTTP ${response.status}`);
  entries.push(manifestEntry(id,resolution,await response.json()));
 }
 const next=addEntries(manifest,entries);
 await writeFile('assets/manifest.json',JSON.stringify(next,null,1)+'\n');
 const bytes=entries.flatMap(e=>Object.values(e.files)).reduce((s,f)=>s+f.size,0);
 console.log(`added ${next.assets.length-manifest.assets.length} models (${(bytes/1e6).toFixed(0)} MB)`);
}
