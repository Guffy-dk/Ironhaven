import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {createServer} from '../server.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function connect(url){return new Promise((resolve,reject)=>{const ws=new WebSocket(url);ws.on('error',reject);ws.on('message',data=>{const m=JSON.parse(data);if(m.type==='welcome'){ws.playerId=m.id;resolve(ws);}});});}
test('authoritative server shares four clients, rejects fifth and unauthorized controls',async()=>{
 const app=createServer({port:0,host:'127.0.0.1',roomCode:'test'}),addr=await app.listen(),base=`http://127.0.0.1:${addr.port}`,url=`ws://127.0.0.1:${addr.port}/play?code=test`;const clients=[];
 try{
  assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/shared/sim.js')).status,200);assert.equal((await fetch(base+'/server.mjs')).status,404);assert.equal((await fetch(base+'/%2e%2e%2fpackage.json')).status,403);
  for(let i=0;i<4;i++)clients.push(await connect(url+'&name=P'+i));
  assert.equal(app.getState().players.length,4);
  const fifth=new WebSocket(url);const close=await new Promise(r=>fifth.on('close',(code)=>r(code)));assert.equal(close,4004);
  const wrong=new WebSocket(`ws://127.0.0.1:${addr.port}/play?code=wrong`);assert.equal(await new Promise(r=>wrong.on('close',code=>r(code))),4003);
  clients[1].send(JSON.stringify({type:'pause'}));await sleep(100);assert.equal(app.getState().paused,false);
  clients[0].send(JSON.stringify({type:'pause'}));await sleep(100);assert.equal(app.getState().paused,true);
  const before=app.getState().resources.wood;
  clients[2].send(JSON.stringify({type:'build',building:'belt',x:3,z:4,dir:1}));await sleep(100);
  assert.equal(app.getState().resources.wood,before-1);assert.ok(app.getState().buildings.some(b=>b.x===3&&b.z===4));
  const synchronized=await Promise.all(clients.map(ws=>new Promise(resolve=>ws.once('message',data=>resolve(JSON.parse(data))))));
  for(const msg of synchronized){assert.equal(msg.state.players.length,4);assert.ok(msg.state.buildings.some(b=>b.x===3&&b.z===4));}
  clients[0].close();await sleep(100);assert.equal(app.getState().players.length,3);
  clients[1].send(JSON.stringify({type:'pause'}));await sleep(100);assert.equal(app.getState().paused,false);
 }finally{for(const ws of clients)ws.terminate();await new Promise(r=>app.server.close(r));}
});
