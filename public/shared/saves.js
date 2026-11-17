import {migrateGame,TYPES,RESOURCE_KEYS,BUILD_EDGE} from './sim.js';
export function parseSave(text){
 if(typeof text!=='string'||text.length>8*1024*1024)throw Error('Save file is too large or invalid.');
 let data;try{data=JSON.parse(text);}catch{throw Error('This is not a valid JSON save file.');}
 const s=data?.state;if(!s||!Array.isArray(s.buildings)||!Array.isArray(s.players)||!s.players.length||!s.terrain||!s.resources)throw Error('This is not an Ironhaven world save.');
 const ids=new Set();for(const b of s.buildings){const type=b.type==='copperSmelter'?'smelter':b.type;const legacyPad=b.type==='launchpad'&&s.version<7;if(!Number.isInteger(b.id)||ids.has(b.id)||!legacyPad&&(!Object.hasOwn(TYPES,type)||!TYPES[type].hp)||!Number.isFinite(b.hp)||b.hp<=0||!Number.isInteger(b.x)||!Number.isInteger(b.z)||Math.abs(b.x)>BUILD_EDGE||Math.abs(b.z)>BUILD_EDGE)throw Error('Save contains an invalid building.');ids.add(b.id);}
 if(!s.buildings.some(b=>b.type==='hq')&&s.status!=='defeat')throw Error('World has no lighthouse.');
 if(!s.players.some(p=>p.id===data.playerId))throw Error('Save has no matching player.');
 for(const r of [...RESOURCE_KEYS,'power'])if(s.resources[r]!==undefined&&(!Number.isFinite(s.resources[r])||s.resources[r]<0))throw Error('Save contains an invalid material count.');
 data.state=migrateGame(s);return data;
}
export function packWorldSave(state,playerId){
 const data=JSON.parse(JSON.stringify(state)),p=data.players.find(p=>p.id===playerId);if(!p)throw Error('No local engineer to save.');p.inventory||={};
 for(const other of data.players)if(other.id!==p.id)for(const[type,items]of Object.entries(other.inventory||{}))(p.inventory[type]||=[]).push(...items);
 data.players=[p];return{state:data,playerId};
}
