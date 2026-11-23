import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{loadModSources,compileInWorker}=require('../desktop/mod-loader.cjs');
if(!process.argv[2])throw Error('Usage: node scripts/check-mods.mjs MODS_DIRECTORY (with mod-list.json); run npm run build first');
const seed=JSON.parse(await readFile(new URL('../release/mod-base.json',import.meta.url),'utf8'));
const packs=await loadModSources(resolve(process.argv[2]));
const result=await compileInWorker(seed,packs,new URL('../release/mod-worker.cjs',import.meta.url));
console.log(JSON.stringify({mods:result.mods,items:Object.keys(result.catalog.items).length,machines:Object.keys(result.catalog.buildings).length},null,2));
