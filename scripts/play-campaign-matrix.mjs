// Full campaigns use only ordinary player commands. Independent runs share no state.
import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';

const powerTrial=process.env.CAMPAIGN_MATRIX==='combat-power';
const reserveTrial=process.env.CAMPAIGN_MATRIX==='power-reserve';
const industryTrial=process.env.CAMPAIGN_MATRIX==='industry-fuel';
const dir=industryTrial?'work/campaign-matrix-industry-fuel':reserveTrial?'work/campaign-matrix-power-reserve':powerTrial?'work/campaign-matrix-combat-power':'work/campaign-matrix';
await mkdir(dir,{recursive:true});
const jobs=[];
function add(seed,policy,difficulty,horizon=9000,endless=false,group='baseline',shedLoad=false,powerReserve=false,coalReserve=false){
 jobs.push({seed,policy,difficulty,horizon,endless,group,shedLoad,powerReserve,coalReserve});
}
if(industryTrial){
 function group(seed,difficulty,horizon=9000,endless=false,label='comparison'){
  add(seed,'industry',difficulty,horizon,endless,label);
  add(seed,'refining',difficulty,horizon,endless,label);
  add(seed,'refining',difficulty,horizon,endless,label,false,false,true);
 }
 group(417,'relaxed');
 group(2026,'standard');
 group(417,'standard');
 group(7,'veteran');
 group(1967,'standard');
 group(417,'relaxed',72000,true);
 group(2801,'standard',72000,true);
 group(8813,'standard',9000,false,'holdout');
 group(4297,'veteran',9000,false,'holdout');
 group(4297,'relaxed',72000,true,'holdout');
 for(const policy of ['pulse','mortars','logistics','early_defense','single'])add(8813,policy,'standard',9000,false,'holdout');
}else if(reserveTrial){
 function triple(seed,policy,difficulty,horizon=9000,endless=false,group='comparison'){
  add(seed,policy,difficulty,horizon,endless,group);
  add(seed,policy,difficulty,horizon,endless,group,true);
  add(seed,policy,difficulty,horizon,endless,group,false,true);
 }
 triple(417,'industry','standard');
 triple(2026,'industry','standard');
 triple(7,'logistics','standard');
 triple(417,'pulse','standard');
 triple(2026,'mortars','standard');
 triple(7,'early_defense','standard');
 triple(417,'industry','relaxed',72000,true);
 triple(2801,'industry','standard',72000,true);
 triple(1967,'industry','standard',9000,false,'holdout');
 triple(8161,'logistics','veteran',9000,false,'holdout');
 triple(8161,'industry','relaxed',72000,true,'holdout');
 add(1967,'single','standard',9000,false,'holdout');
 add(9419,'no_artillery','standard');
}else if(powerTrial){
 function pair(seed,policy,difficulty,horizon=9000,endless=false,group='comparison'){
  for(const shedLoad of [false,true])add(seed,policy,difficulty,horizon,endless,group,shedLoad);
 }
 for(const seed of [417,2026,7]){
  pair(seed,'industry','standard');
  pair(seed,'logistics','standard');
 }
 pair(417,'pulse','standard');
 pair(2026,'mortars','standard');
 pair(7,'early_defense','standard');
 pair(417,'industry','veteran');
 pair(417,'industry','relaxed',72000,true);
 pair(2801,'industry','standard',72000,true);
 pair(3511,'industry','standard',9000,false,'holdout');
 pair(3511,'pulse','standard',9000,false,'holdout');
 pair(9419,'industry','relaxed',72000,true,'holdout');
 pair(9419,'logistics','veteran',9000,false,'holdout');
 add(3511,'single','standard',9000,false,'holdout');
 add(9419,'no_artillery','standard',9000,false,'holdout');
 add(2026,'early_defense','veteran');
}else{
 for(const seed of [417,2026,7]){
  for(const difficulty of ['relaxed','standard','veteran'])add(seed,'industry',difficulty);
  for(const policy of ['single','pulse','no_artillery','early_defense','mortars','logistics'])add(seed,policy,'standard');
 }
 for(const policy of ['industry','pulse','early_defense','mortars','logistics'])add(2801,policy,'standard',9000,false,'holdout');
 add(417,'industry','relaxed',72000,true);
 add(2026,'logistics','standard',72000,true);
 add(6823,'industry','veteran',72000,true,'holdout');
}

const workers=Number(process.env.CAMPAIGN_WORKERS||2);
const resume=process.env.CAMPAIGN_RESUME==='1';
if(!Number.isInteger(workers)||workers<1||workers>8)throw Error('CAMPAIGN_WORKERS must be from 1 to 8');
let next=0;
const reports=[];
async function run(job){
 const {seed,policy,difficulty,horizon,endless,group,shedLoad,powerReserve,coalReserve}=job;
 const stem=`campaign-${policy}-${seed}${difficulty==='standard'?'':'-'+difficulty}-${horizon}${endless?'-endless':''}${shedLoad?'-shed-load':''}${powerReserve?'-reserve':''}${coalReserve?'-fuel':''}`;
 const reportPath=`work/${stem}.json`;
 async function readReport(){
  const report=JSON.parse(await readFile(reportPath,'utf8'));
  for(const key of ['seed','policy','difficulty','horizon','endless']){
   if(report[key]!==job[key])throw Error(`Checkpoint mismatch for ${stem}: ${key}`);
  }
  if((report.shedLoad??false)!==shedLoad||(report.powerReserve??false)!==powerReserve||(report.coalReserve??false)!==coalReserve)throw Error(`Power policy mismatch for ${stem}`);
  return {...report,group};
 }
 if(resume){
  try{return await readReport();}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const log=await open(`${dir}/${stem}.log`,'w');
 try{
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/play-campaign.mjs',String(seed),policy,difficulty,String(horizon),endless?'endless':'campaign'],{env:{...process.env,CAMPAIGN_SHED_LOAD:shedLoad?'1':'0',CAMPAIGN_POWER_RESERVE:powerReserve?'1':'0',CAMPAIGN_COAL_RESERVE:coalReserve?'1':'0'},stdio:['ignore',log.fd,log.fd]});
   child.on('error',reject);
   child.on('exit',(code,signal)=>code===0?resolve():reject(Error(`${stem} exited ${signal??code}`)));
  });
 }finally{await log.close();}
 return readReport();
}
async function worker(){
 while(next<jobs.length){
  const index=next++;
  const report=await run(jobs[index]);
  reports[index]=report;
  console.log(`${report.difficulty} ${report.policy} ${report.seed} ${report.horizon} ${report.powerReserve?'reserve':report.shedLoad?'shed':'control'}: ${report.outcome}, swarm ${report.wave}, ${report.kills} kills`);
 }
}
await Promise.all(Array.from({length:workers},worker));
await writeFile(`${dir}/results.json`,JSON.stringify(reports,null,2));
