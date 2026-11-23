import {readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {compileMods} from '../sdk/lua-mods.mjs';
export const coreItems=['ore','copperOre','wood','plate','gear','copper','steel','circuit','module','coal'];
export async function compileIndustry(){
 const info=JSON.parse(await readFile(new URL('../content/industry/info.json',import.meta.url),'utf8'));
 const source=await readFile(new URL('../content/industry/data.lua',import.meta.url),'utf8');
 const seed={item:Object.fromEntries(coreItems.map(name=>[name,{type:'item',name,localised_name:name,color:'#bfcac6',stored:!['ore','copperOre'].includes(name)}]))};
 const result=compileMods(seed,[{info,files:{'data.lua':source}}]);
 const hash=createHash('sha256').update(JSON.stringify(result.raw)).digest('hex');
 const destination=new URL('../public/shared/industry-catalog.json',import.meta.url),temporary=new URL(destination.href+'.'+process.pid+'.tmp');
 await writeFile(temporary,JSON.stringify({hash,raw:result.raw},null,2)+'\n');await rename(temporary,destination);
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await compileIndustry();
