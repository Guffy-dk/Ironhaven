import {migrateGame,TYPES,RESOURCE_KEYS} from './sim.js';
export function parseSave(text){
 if(typeof text!=='string'||text.length>8*1024*1024)throw Error('Save file is too large or invalid.');
 let data;try{data=JSON.parse(text);}catch{throw Error('This is not a valid JSON save file.');}
 const s=data?.state;if(!s||!Array.isArray(s.buildings)||s.buildings.length>700||!Array.isArray(s.players)||!s.players.length||!s.terrain||!s.resources)throw Error('This is not an Ironhaven world save.');
 const ids=new Set();for(const b of s.buildings){if(!Number.isInteger(b.id)||ids.has(b.id)||!Object.hasOwn(TYPES,b.type)||!TYPES[b.type].hp||!Number.isFinite(b.hp)||b.hp<=0||!Number.isInteger(b.x)||!Number.isInteger(b.z)||Math.abs(b.x)>26||Math.abs(b.z)>26)throw Error('Save contains an invalid building.');ids.add(b.id);}
 if(!s.buildings.some(b=>b.type==='hq')&&s.status!=='defeat')throw Error('World has no command core.');
 if(!s.players.some(p=>p.id===data.playerId))throw Error('Save has no matching player.');
 for(const r of RESOURCE_KEYS)if(s.resources[r]!==undefined&&(!Number.isFinite(s.resources[r])||s.resources[r]<0))throw Error('Save contains an invalid material count.');
 data.state=migrateGame(s);return data;
}
