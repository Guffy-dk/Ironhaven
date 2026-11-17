// Portable player preferences. Keep hardware-specific graphics/display settings separate.
// A future Steam Cloud adapter can persist this versioned JSON without changing UI/gameplay.
export const PREFERENCES_KEY='ironhaven.preferences.v1';
const defaults=()=>({version:1,controls:{panSpeed:1,zoomSpeed:1},audio:{masterVolume:1,muted:true},interface:{mineralLabels:true,buildingLevels:true}});
const bounded=(value,fallback,min,max)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
export function normalizePreferences(value){
 const base=defaults();if(!value||value.version!==1)return base;
 return {version:1,controls:{panSpeed:bounded(value.controls?.panSpeed,1,.25,2.5),zoomSpeed:bounded(value.controls?.zoomSpeed,1,.25,2.5)},audio:{masterVolume:bounded(value.audio?.masterVolume,1,0,1),muted:typeof value.audio?.muted==='boolean'?value.audio.muted:true},interface:{mineralLabels:value.interface?.mineralLabels!==false,buildingLevels:value.interface?.buildingLevels!==false}};
}
export function loadPreferences(storage){try{return normalizePreferences(JSON.parse(storage.getItem(PREFERENCES_KEY)));}catch{return defaults();}}
export function savePreferences(storage,value){try{storage.setItem(PREFERENCES_KEY,JSON.stringify(normalizePreferences(value)));return true;}catch{return false;}}
