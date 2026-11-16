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
 core.lighthouseHeading=heading+Math.sign(distance)*Math.min(Math.abs(distance),TURN_SPEED*seconds);
}
export function lighthouseBeam(core,heading=lighthouseHeading(core)){
 if(!core||core.hp<=0)return null;
 return {x:core.x,z:core.z,dx:Math.sin(heading),dz:Math.cos(heading)};
}
export function isInLighthouseBeam(beam,{x,z}){
 if(!beam)return false;
 const dx=x-beam.x,dz=z-beam.z,distance=Math.hypot(dx,dz);
 return distance<=LIGHTHOUSE_REACH&&dx*beam.dx+dz*beam.dz>=distance*Math.cos(LIGHTHOUSE_CONE);
}
