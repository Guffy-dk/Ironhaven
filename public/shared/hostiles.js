// Shared by the authoritative Windows host, LAN guests and the renderer.
export const HOSTILES=Object.freeze({
 runner:{name:'Shore runner',health:1,speed:1.2,damage:.8,range:.85},
 drowned:{name:'Drowned',health:1.2,speed:.78,damage:1.15,range:.85},
 guard:{name:'Shell guard',health:2,speed:.65,damage:2.1,range:.95},
 spitter:{name:'Fog spitter',health:1.1,speed:.82,damage:.8,range:5.5},
 walker:{name:'Abyss walker',health:8,speed:.62,damage:3.3,range:1.5}
});
export function hostileKind(e){return Object.hasOwn(HOSTILES,e.kind)?e.kind:e.coreHunter?'walker':e.brute?'guard':'runner';}
export function waveKind(wave,index,count){
 if(wave>=5&&wave%5===0&&index===count-1)return 'walker';
 if(wave>=4&&index%9===5)return 'spitter';
 if(index%7===0)return 'guard';
 return index%3===1?'drowned':'runner';
}
export function exposeHostile(e,lit,dt){
 e.illuminated=lit;
 e.lightExposure=lit?Math.min(4,(e.lightExposure||0)+dt):Math.max(0,(e.lightExposure||0)-dt*2);
 e.lightRest=Math.max(0,(e.lightRest||0)-dt);
 // A bounded response prevents one stationary beam from indefinitely pinning a wave.
 if(lit&&!e.lightRest&&!e.lightResponse){
  const kind=hostileKind(e);
  if(kind==='runner'||kind==='drowned'){e.lightResponse=kind==='runner'?1.4:2.8;e.lightRest=10;}
 }
 e.lightResponse=Math.max(0,(e.lightResponse||0)-dt);
}
export function hostileDamage(e,damage){
 const kind=hostileKind(e);
 const protection=kind==='guard'?(e.lightExposure>=.65?1:.5):kind==='walker'?(e.lightExposure>=1?1:.75):1;
 return damage*protection;
}
export function hostileDestination(e,core,beam,target,out){
 const kind=hostileKind(e);
 if(e.illuminated&&e.lightResponse>0&&beam){
  if(kind==='drowned'){
   // Approach the light source; the player can draw them away from industry.
   return core;
  }
 }
 return target;
}

// A short slowdown helps defenses keep a wave together instead of forcing flank walls.
export function hostileMoveMultiplier(e){return hostileKind(e)==='runner'&&e.illuminated&&e.lightResponse>0?.75:1;}
