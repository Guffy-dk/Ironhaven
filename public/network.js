// Direct LAN data channels. Signalling is exchanged by the players, not a service.
export function encodeCode(description){return'IH1.'+btoa(JSON.stringify({type:description.type,sdp:description.sdp}));}
export function decodeCode(code,expected){
 const input=String(code).trim();if(input.length>32768||!input.startsWith('IH1.'))throw Error('Koden er ikke en Ironhaven-invitation. Kopiér hele koden.');
 let data;try{data=JSON.parse(atob(input.slice(4)));}catch{throw Error('Koden er beskadiget. Kopiér hele koden igen.');}
 if(data.type!==expected||typeof data.sdp!=='string'||data.sdp.length>24000)throw Error(expected==='answer'?'Indsæt vennens svarkode, ikke invitationen.':'Indsæt værtens invitation, ikke en svarkode.');
 return{type:data.type,sdp:data.sdp};
}
function iceReady(pc){return new Promise((resolve,reject)=>{
 if(pc.iceGatheringState==='complete'){resolve();return;}
 const timeout=setTimeout(()=>{cleanup();if(pc.localDescription?.sdp.includes('a=candidate:'))resolve();else reject(Error('Ingen lokal netværksadresse fundet. Tillad WebRTC i browseren og prøv igen.'));},10000);
 const changed=()=>{if(pc.iceGatheringState==='complete'){cleanup();resolve();}};
 function cleanup(){clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',changed);}
 pc.addEventListener('icegatheringstatechange',changed);
});}
export class Lan{
 constructor({onMessage,onPeerOpen,onPeerClose,onStatus}){this.peers=new Map();this.next=1;this.role=null;this.onMessage=onMessage;this.onPeerOpen=onPeerOpen;this.onPeerClose=onPeerClose;this.onStatus=onStatus;this.pending=null;}
 makePeer(id){
  if(typeof RTCPeerConnection==='undefined')throw Error('Denne browser understøtter ikke WebRTC. Brug en nyere Chrome, Edge eller Firefox.');
  // No STUN/TURN: traffic stays on the local network and needs no public server.
  const pc=new RTCPeerConnection({iceServers:[],bundlePolicy:'max-bundle'}),peer={id,pc,channel:null,playerId:null,name:'Venter på ven',ready:false,created:Date.now(),budget:0,budgetAt:Date.now()};this.peers.set(id,peer);
  pc.onconnectionstatechange=()=>{this.onStatus?.();if(['failed','closed','disconnected'].includes(pc.connectionState)){if(pc.connectionState==='disconnected'){clearTimeout(peer.disconnectTimer);peer.disconnectTimer=setTimeout(()=>{if(pc.connectionState==='disconnected')this.drop(id);},10000);}else this.drop(id);}};
  return peer;
 }
 wire(peer,channel){peer.channel=channel;
  channel.onopen=()=>{peer.ready=true;this.onPeerOpen?.(peer);this.onStatus?.();};
  channel.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>1500000)return;
   if(this.role==='host'){if(e.data.length>4096)return;const now=Date.now();if(now-peer.budgetAt>1000){peer.budget=0;peer.budgetAt=now;}if(++peer.budget>80)return;}
   let message;try{message=JSON.parse(e.data);}catch{return;}this.onMessage?.(peer,message);
  };
  channel.onclose=()=>this.drop(peer.id);channel.onerror=()=>this.onStatus?.();
 }
 async invite(){
  if(this.role==='client')throw Error('Du er tilsluttet en anden verden. Forlad den først.');
  // Expire abandoned invitations to release the three guest slots.
  for(const[id,p]of this.peers)if(!p.ready&&Date.now()-p.created>300000)this.drop(id);
  if(this.peers.size>=3)throw Error('Alle 3 gæstepladser er optaget. Fjern en ubrugt invitation først.');
  this.role='host';const peer=this.makePeer(this.next++);this.pending=peer.id;
  try{this.wire(peer,peer.pc.createDataChannel('ironhaven',{ordered:true}));await peer.pc.setLocalDescription(await peer.pc.createOffer());await iceReady(peer.pc);this.onStatus?.();return{id:peer.id,code:encodeCode(peer.pc.localDescription)};}catch(e){this.drop(peer.id);throw e;}
 }
 async accept(code){const peer=this.peers.get(this.pending);if(!peer)throw Error('Lav først en invitation.');if(peer.pc.signalingState!=='have-local-offer')throw Error('Denne invitation er allerede brugt. Lav en ny til næste ven.');await peer.pc.setRemoteDescription(decodeCode(code,'answer'));return peer;}
 async join(code){
  const description=decodeCode(code,'offer');this.close();this.role='client';const peer=this.makePeer('host');
  peer.pc.ondatachannel=e=>this.wire(peer,e.channel);
  try{await peer.pc.setRemoteDescription(description);await peer.pc.setLocalDescription(await peer.pc.createAnswer());await iceReady(peer.pc);return encodeCode(peer.pc.localDescription);}catch(e){this.close();throw e;}
 }
 send(peer,message){if(peer?.channel?.readyState==='open'&&peer.channel.bufferedAmount<1000000){peer.channel.send(typeof message==='string'?message:JSON.stringify(message));return true;}return false;}
 broadcast(message){const raw=JSON.stringify(message);for(const p of this.peers.values())if(p.ready)this.send(p,raw);}
 drop(id){const peer=this.peers.get(id);if(!peer)return;this.peers.delete(id);clearTimeout(peer.disconnectTimer);peer.channel&&(peer.channel.onclose=null);peer.channel?.close();peer.pc.onconnectionstatechange=null;peer.pc.close();this.onPeerClose?.(peer);this.onStatus?.();}
 close(){for(const id of [...this.peers.keys()])this.drop(id);this.role=null;this.pending=null;}
}
