// Downloads the CC0 art listed in assets/manifest.json into assets-cache/ and verifies size and MD5.
// Idempotent: verified files are kept. The cache is packaged with the desktop game, not committed.
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {dirname,join} from 'node:path';

export const CACHE='assets-cache';
const md5=bytes=>createHash('md5').update(bytes).digest('hex');

export async function assetFiles(){
 const manifest=JSON.parse(await readFile('assets/manifest.json','utf8'));
 return manifest.assets.flatMap(asset=>Object.entries(asset.files).map(([name,file])=>({asset,name,...file,path:join(CACHE,{hdri:'sky',model:'models'}[asset.kind]??'textures',asset.id,name)})));
}

async function verified(file){
 try{const info=await stat(file.path);if(info.size!==file.size)return false;return md5(await readFile(file.path))===file.md5;}catch{return false;}
}

export async function fetchAssets({log=console.log}={}){
 const files=await assetFiles();let downloaded=0;
 for(const file of files){
  if(await verified(file))continue;
  let bytes;
  for(let attempt=1;attempt<=4;attempt++){
   try{const response=await fetch(file.url);if(!response.ok)throw Error(`HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());break;}
   catch(error){if(attempt===4)throw Error(`Could not download ${file.url}: ${error.message}`);await new Promise(r=>setTimeout(r,1000*2**attempt));}
  }
  if(bytes.length!==file.size||md5(bytes)!==file.md5)throw Error(`Checksum mismatch for ${file.asset.id}/${file.name}`);
  await mkdir(dirname(file.path),{recursive:true});await writeFile(file.path,bytes);downloaded++;
  log(`fetched ${file.asset.id}/${file.name} (${(bytes.length/1e6).toFixed(1)} MB)`);
 }
 const licenses=JSON.parse(await readFile('assets/manifest.json','utf8')).assets.map(a=>`${a.id}: ${a.source} (${a.license}, ${a.author})`).join('\n');
 await mkdir(CACHE,{recursive:true});await writeFile(join(CACHE,'ASSET-LICENSES.txt'),`Ironhaven CC0 art sources\n\n${licenses}\n`);
 return {files:files.length,downloaded};
}

if(import.meta.url===`file://${process.argv[1]}`){
 const result=await fetchAssets();console.log(`assets ready: ${result.files} files, ${result.downloaded} downloaded`);
}
