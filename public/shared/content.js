import baseRaw from './industry-catalog.json' with {type:'json'};
import {validateCatalog,contentSignature,checkContent} from './mod-catalog.js';
const payload=typeof document!=='undefined'?document.getElementById('ironhaven-mod-data')?.textContent:null;
const injected=payload?JSON.parse(payload):null;
export const CONTENT_RAW=injected?.raw??baseRaw.raw;
export const CONTENT=validateCatalog(CONTENT_RAW);
export const ACTIVE_MODS=injected?.mods??[];
export const CONTENT_SIGNATURE=contentSignature(ACTIVE_MODS,baseRaw.hash);
// 0.20.2 precedes the additive harbor catalog. Preserve exact mod hashes during migration.
const previousCatalog='c286c95165328ebb33f5700d94a37b771fa2f586e7da914a3e140ec088a2e324';
export const requireWorldContent=state=>{
 if(state.contentSignature===contentSignature(ACTIVE_MODS,previousCatalog))return CONTENT_SIGNATURE;
 return checkContent(state,ACTIVE_MODS,baseRaw.hash);
};
export const MOD_BUILDINGS=Object.keys(CONTENT.buildings);
