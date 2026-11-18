import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,loadPreferences,savePreferences,PREFERENCES_KEY} from '../public/preferences.js';
test('portable preferences round-trip without world or hardware data',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const prefs=normalizePreferences({version:1,controls:{panSpeed:1.75,zoomSpeed:.5},audio:{masterVolume:.4,muted:false},world:{seed:1},graphics:{resolution:'3840x2160'}});
 assert.equal(savePreferences(storage,prefs),true);assert.deepEqual(loadPreferences(storage),prefs);
 assert.deepEqual(Object.keys(JSON.parse(data.get(PREFERENCES_KEY))),['version','controls','audio','interface']);
});
test('invalid or unavailable preference storage falls back safely and clamps supported values',()=>{
 assert.equal(normalizePreferences({version:1,controls:{panSpeed:Infinity,zoomSpeed:20},audio:{masterVolume:-1,muted:'false'}}).controls.panSpeed,1);
 assert.equal(normalizePreferences({version:1,controls:{zoomSpeed:20}}).controls.zoomSpeed,2.5);
 assert.equal(loadPreferences({getItem(){throw Error('unavailable');}}).controls.panSpeed,1);
 assert.equal(loadPreferences({getItem:()=>'{broken'}).audio.muted,true);
 assert.equal(normalizePreferences({version:99}).controls.panSpeed,1);
 assert.equal(savePreferences({setItem(){throw Error('full');}},normalizePreferences(null)),false);
});
test('existing player preferences enable type labels by default and preserve the new opt-out',()=>{
 assert.equal(normalizePreferences({version:1,interface:{buildingLevels:false}}).interface.buildingTypes,true);
 assert.equal(normalizePreferences({version:1,interface:{buildingTypes:false}}).interface.buildingTypes,false);
});
