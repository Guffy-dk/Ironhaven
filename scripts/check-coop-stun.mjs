// Verifies in a real Chromium that the shipped STUN configuration yields a public (srflx) address.
// Requires outbound UDP; CI runners allow it, some sandboxes do not.
import {chromium} from 'playwright';
import {ICE_SERVERS} from '../public/network.js';
const browser=await chromium.launch(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{});
try{
 const page=await browser.newPage();
 const types=await page.evaluate(async servers=>{
  const pc=new RTCPeerConnection({iceServers:servers});pc.createDataChannel('probe');
  await pc.setLocalDescription(await pc.createOffer());
  await new Promise(done=>{const timer=setTimeout(done,10000);pc.onicegatheringstatechange=()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);done();}};});
  return (pc.localDescription.sdp.match(/a=candidate:.*/g)||[]).map(line=>line.split(' ')[7]);
 },ICE_SERVERS.map(server=>({...server})));
 console.log(JSON.stringify({candidateTypes:types}));
 if(!types.includes('srflx'))throw Error('No public (srflx) candidate. Internet co-op needs outbound UDP to the STUN servers.');
}finally{await browser.close();}
