import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { WebSocketServer, WebSocket } from 'ws';
import { createGame, addPlayer, removePlayer, command, step, STEP } from './public/shared/sim.js';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
export function createServer({port=Number(process.env.PORT)||3000,host='0.0.0.0',roomCode=process.env.ROOM_CODE||''}={}){
 let state=createGame();const peers=new Map();
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/info'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({name:'Ironhaven',players:state.players.length,maxPlayers:4,codeRequired:!!roomCode}));return;}
  let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
  if(name==='/')name='/index.html';
  // Explicit public root; source code, credentials and node_modules are never served.
  const target=path.resolve(root,'.'+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const data=await readFile(target),ext=path.extname(target);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404).end('Not found');}
 });
 const wss=new WebSocketServer({server,path:'/play',maxPayload:2048});
 const send=(ws,msg)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<500000)ws.send(JSON.stringify(msg));};
 wss.on('connection',(ws,req)=>{
  const url=new URL(req.url,'http://localhost');
  // LAN-only same-origin browser clients; non-browser integration clients omit Origin.
  if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{ws.close(1008,'Invalid origin');return;}if(origin.host!==req.headers.host){ws.close(1008,'Wrong origin');return;}}
  if(roomCode&&url.searchParams.get('code')!==roomCode){ws.close(4003,'Wrong room code');return;}
  const p=addPlayer(state,url.searchParams.get('name')||'Engineer');if(!p){ws.close(4004,'Room is full (4/4)');return;}
  peers.set(ws,p.id);send(ws,{type:'welcome',id:p.id,state});let budget=0;
  ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);
  ws.on('message',raw=>{if(++budget>80){send(ws,{type:'error',message:'Too many commands'});return;}let cmd;try{cmd=JSON.parse(raw);}catch{return;}
   if(cmd.type==='restart'){
    if(peers.get(ws)!==state.players[0]?.id){send(ws,{type:'error',message:'Only the host can restart'});return;}
    const old=state;state=createGame();for(const[socket,id]of peers){const op=old.players.find(p=>p.id===id);const np=addPlayer(state,op?.name);peers.set(socket,np.id);send(socket,{type:'welcome',id:np.id,state});}return;
   }
   const error=command(state,peers.get(ws),cmd);if(error)send(ws,{type:'error',message:error});
  });ws.on('close',()=>{removePlayer(state,peers.get(ws));peers.delete(ws);});
  ws.resetBudget=()=>budget=0;
 });
 const timer=setInterval(()=>{if(peers.size===0)return;for(let i=0;i<state.speed;i++)step(state,STEP);if(state.tick%2===0||state.paused||state.status!=='playing')for(const[ws]of peers)send(ws,{type:'state',state});},50);
 const heartbeat=setInterval(()=>{for(const[ws]of peers){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},15000);
 const rateTimer=setInterval(()=>{for(const[ws]of peers)ws.resetBudget();},1000);
 server.on('close',()=>{clearInterval(timer);clearInterval(heartbeat);clearInterval(rateTimer);for(const[ws]of peers)ws.terminate();wss.close();});
 return{server,wss,getState:()=>state,listen:()=>new Promise(resolve=>server.listen(port,host,()=>resolve(server.address())))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const app=createServer();const address=await app.listen();console.log(`\nIRONHAVEN · LAN Co-op\n  This computer: http://localhost:${address.port}`);
 for(const entries of Object.values(networkInterfaces()))for(const a of entries||[])if(a.family==='IPv4'&&!a.internal)console.log(`  LAN players:   http://${a.address}:${address.port}`);
 console.log(`  Up to 4 players · ${process.env.ROOM_CODE?'Room code enabled':'No password (trusted LAN only)'}\n  Ctrl+C stops the server.\n`);
}
