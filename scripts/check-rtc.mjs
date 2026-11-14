const {default:wrtc}=await import(process.env.RTC_MODULE||'@roamhq/wrtc');
import assert from 'node:assert/strict';
import {Lan} from '../public/network.js';
import {createGame,addPlayer,command} from '../public/shared/sim.js';
globalThis.RTCPeerConnection=wrtc.RTCPeerConnection;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async f=>{for(let i=0;i<100;i++){if(f())return;await wait(50);}throw Error('Timed out waiting for data channel');};
const state=createGame();const local=addPlayer(state,'Host');const clients=[],received=[];
const host=new Lan({onPeerOpen(){},onPeerClose(){},onMessage(peer,msg){if(msg.type==='hello'){peer.playerId=addPlayer(state,msg.name).id;host.send(peer,{type:'welcome',id:peer.playerId,state});}else if(msg.type==='command'){const error=command(state,peer.playerId,msg.command);host.send(peer,{type:'result',error,state});}}});
try{
 for(let i=0;i<3;i++){
  const result={};received.push(result);
  const client=new Lan({onPeerOpen(peer){client.send(peer,{type:'hello',name:'Guest '+i});},onMessage(peer,msg){result[msg.type]=msg;},onPeerClose(){}});clients.push(client);
  const offer=await host.invite();const answer=await client.join(offer.code);await host.accept(answer);await until(()=>result.welcome);
  assert.equal(result.welcome.state.players.length,i+2);
 }
 assert.equal(state.players.length,4);await assert.rejects(()=>host.invite(),/occupied/);
 clients[2].send(clients[2].peers.get('host'),{type:'command',command:{type:'build',building:'belt',x:3,z:4,dir:2}});
 await until(()=>received[2].result);assert.equal(received[2].result.error,null);assert.ok(state.buildings.some(b=>b.x===3&&b.z===4));
 host.broadcast({type:'state',state});await until(()=>received.every(r=>r.state));
 for(const r of received){assert.equal(r.state.state.players.length,4);assert.equal(r.state.state.resources.wood,state.resources.wood);}
 console.log('PASS: 1 browser-style host + 3 direct RTC guests, invitation/answer exchange, fourth guest rejected, shared construction and synchronized snapshots.');
}catch(e){console.error(e);process.exitCode=1;}finally{for(const c of clients)c.close();host.close();}
// libwebrtc owns long-lived native threads; all channels and connections above are closed.
setTimeout(()=>process.exit(process.exitCode||0),100);
