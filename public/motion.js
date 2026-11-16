// Render between completed simulation updates. Simulation and LAN state stay authoritative.
export class RenderMotion {
 constructor(){this.reset();}
 reset(){
  this.current=new Map();this.previous=new Map();
  this.tick=undefined;this.time=undefined;this.sampledAt=0;this.duration=50;this.alpha=1;
 }
 update(state,now){
  if(this.tick!==state.tick){
   const advancing=this.tick!==undefined&&state.tick>this.tick;
   this.previous=advancing?this.current:new Map();
   this.previousTick=advancing?this.tick:state.tick;
   this.previousTime=advancing?this.time:state.time;
   this.duration=Math.max(35,Math.min(125,now-this.sampledAt));
   this.current=new Map();
   for(const actors of [state.players,state.enemies])for(const {id,x,z,hp} of actors)this.current.set(id,{x,z,hp});
   this.sampledAt=now;this.tick=state.tick;this.time=state.time;
  }
  this.alpha=Math.max(0,Math.min(1,(now-this.sampledAt)/this.duration));
  this.renderTick=this.previousTick+(this.tick-this.previousTick)*this.alpha;
  this.renderTime=this.previousTime+(this.time-this.previousTime)*this.alpha;
 }
 position(actor,out){
  const previous=this.previous.get(actor.id);
  const interpolate=previous&&previous.hp>0&&actor.hp>0&&Math.hypot(actor.x-previous.x,actor.z-previous.z)<2;
  out.x=interpolate?previous.x+(actor.x-previous.x)*this.alpha:actor.x;
  out.z=interpolate?previous.z+(actor.z-previous.z)*this.alpha:actor.z;
  return out;
 }
}
