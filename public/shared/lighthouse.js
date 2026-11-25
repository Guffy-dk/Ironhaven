export const LIGHTHOUSE_REACH=40;
export const LIGHTHOUSE_CONE=Math.PI/9;
export const LIT_RANGE_MULTIPLIER=1.2;
const TURN_SPEED=Math.PI*.7;
const DEFAULT_HEADING=Math.PI;

export function lighthouseHeading(core){
 return Number.isFinite(core?.lighthouseHeading)?core.lighthouseHeading:DEFAULT_HEADING;
}
export function turnLighthouse(core,seconds){
 if(!core||!Number.isFinite(core.lighthouseAim))return;
 const heading=lighthouseHeading(core),error=core.lighthouseAim-heading;
 const distance=Math.atan2(Math.sin(error),Math.cos(error));
 core.lighthouseHeading=heading+Math.sign(distance)*Math.min(Math.abs(distance),(TURN_SPEED+(core.islandBeacon?((core.level||1)-1)*.055:0))*seconds);
}
export function lighthouseBeam(core,heading=lighthouseHeading(core)){
 if(!core||core.hp<=0)return null;
 return {x:core.x,z:core.z,dx:Math.sin(heading),dz:Math.cos(heading),reach:core.islandBeacon?192+((core.level||1)-1)*3:LIGHTHOUSE_REACH,cone:core.islandBeacon?Math.PI/5+((core.level||1)-1)*Math.PI/360:LIGHTHOUSE_CONE};
}
export function isInLighthouseBeam(beam,{x,z}){
 if(!beam)return false;
 const dx=x-beam.x,dz=z-beam.z,distance=Math.hypot(dx,dz);
 return distance<=(beam.reach??LIGHTHOUSE_REACH)&&dx*beam.dx+dz*beam.dz>=distance*Math.cos(beam.cone??LIGHTHOUSE_CONE);
}

export const attackBearing=side=>[-Math.PI/2,Math.PI,Math.PI/2,0,Math.PI*.75,Math.PI*.25,-Math.PI*.25,-Math.PI*.75][side]??Math.PI;
