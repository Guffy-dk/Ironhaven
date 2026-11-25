// Full campaigns use only ordinary player commands. Independent runs share no state.
import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';

const powerTrial=process.env.CAMPAIGN_MATRIX==='combat-power';
const reserveTrial=process.env.CAMPAIGN_MATRIX==='power-reserve';
const industryTrial=process.env.CAMPAIGN_MATRIX==='industry-fuel';
const marineMatrix=process.env.CAMPAIGN_MATRIX==='marine-power';
const coalPowerMatrix=process.env.CAMPAIGN_MATRIX==='coal-versus-marine';
const fallbackMatrix=process.env.CAMPAIGN_MATRIX==='sentry-fallback';
const leadMatrix=process.env.CAMPAIGN_MATRIX==='reserve-lead';
const originMatrix=process.env.CAMPAIGN_MATRIX==='power-origin';
const recoveryMatrix=leadMatrix||originMatrix||process.env.CAMPAIGN_MATRIX==='power-recovery';
const outageMatrix=process.env.CAMPAIGN_MATRIX==='outage-reserve';
const repairMatrix=process.env.CAMPAIGN_MATRIX==='repair-reserve';
const dir=leadMatrix?'work/campaign-matrix-reserve-lead':originMatrix?'work/campaign-matrix-power-origin':recoveryMatrix?'work/campaign-matrix-power-recovery':outageMatrix?'work/campaign-matrix-outage-reserve':repairMatrix?'work/campaign-matrix-repair-reserve':fallbackMatrix?'work/campaign-matrix-sentry-fallback':coalPowerMatrix?'work/campaign-matrix-coal-versus-marine':marineMatrix?'work/campaign-matrix-marine-power':industryTrial?'work/campaign-matrix-industry-fuel':reserveTrial?'work/campaign-matrix-power-reserve':powerTrial?'work/campaign-matrix-combat-power':'work/campaign-matrix';
await mkdir(dir,{recursive:true});
const jobs=[];
function add(seed,policy,difficulty,horizon=9000,endless=false,group='baseline',shedLoad=false,powerReserve=false,coalReserve=false,marineTrial=false,coalPowerTrial=false,sentryFallback=false,repairReserve=false){
 jobs.push({seed,policy,difficulty,horizon,endless,group,shedLoad,powerReserve,coalReserve,marineTrial,coalPowerTrial,sentryFallback,repairReserve});
}
if(leadMatrix){
 for(const seed of [417,2026,7001]){
  for(const policy of ['industry','early_defense','pulse','mortars','logistics','no_artillery','single']){
   add(seed,policy,'standard',9000,false,'comparison');
  }
  add(seed,'industry','relaxed',9000,false,'comparison');
  add(seed,'industry','veteran',9000,false,'comparison');
 }
 for(const [seed,policy,difficulty] of [[4741,'pulse','standard'],[4741,'harbor','standard'],[9257,'logistics','standard'],[9257,'industry','veteran'],[9257,'mortars','veteran']]){
  add(seed,policy,difficulty,9000,false,'holdout');
 }
 add(417,'industry','relaxed',12000,true,'comparison');
 add(2026,'logistics','standard',12000,true,'endurance');
 add(9257,'industry','relaxed',12000,true,'holdout');
}else if(originMatrix){
 const pair=(seed,policy,difficulty='standard',endless=false,group='comparison')=>{
  for(const rebuildPriority of [false,true]){
   add(seed,policy,difficulty,endless?12000:9000,endless,group);
   jobs.at(-1).rebuildPriority=rebuildPriority;
  }
 };
 pair(417,'industry');
 pair(417,'mortars');
 pair(417,'early_defense');
 pair(417,'industry','relaxed',true);
 pair(2026,'industry');
 pair(2026,'pulse');
 pair(2026,'logistics');
 pair(2026,'industry','veteran');
 pair(7001,'industry');
 pair(7001,'no_artillery');
 pair(7001,'industry','veteran');
 pair(9067,'industry','relaxed',true);
 pair(3583,'pulse','standard',false,'holdout');
 pair(8363,'industry','veteran',false,'holdout');
 pair(8363,'industry','relaxed',true,'holdout');
 for(const seed of [417,2026,7001])add(seed,'single','standard');
 add(2603,'harbor','standard');
 add(2603,'industry','standard');
}else if(recoveryMatrix){
 function campaign(seed,policy,difficulty,group='comparison'){
  add(seed,policy,difficulty,9000,false,group);
 }
 for(const seed of [417,2026,7001]){
  for(const difficulty of ['relaxed','standard','veteran'])campaign(seed,'industry',difficulty);
  for(const policy of ['early_defense','pulse','mortars','logistics','no_artillery','single'])campaign(seed,policy,'standard');
 }
 for(const policy of ['industry','pulse','mortars','logistics','harbor'])campaign(2603,policy,'standard','holdout');
 add(417,'industry','relaxed',12000,true,'comparison');
 add(6197,'industry','relaxed',12000,true,'prior-stall',false,false,false,true);
 add(9067,'industry','relaxed',12000,true,'holdout');
}else if(repairMatrix||outageMatrix){
 function pair(seed,policy,difficulty,horizon=9000,endless=false,group='comparison',marine=false){
  for(const reserve of [false,true])add(seed,policy,difficulty,horizon,endless,group,false,false,false,marine,false,false,reserve);
 }
 pair(9419,'no_artillery','standard',9000,false,'prior-stall');
 pair(8813,'logistics','standard',9000,false,'prior-stall');
 pair(6197,'industry','relaxed',12000,true,'prior-stall',true);
 pair(417,'industry','standard');
 pair(2026,'industry','standard');
 pair(417,'industry','relaxed',12000,true);
 pair(1967,'industry','standard');
 pair(4297,'mortars','veteran');
 pair(2026,'pulse','standard');
 pair(6619,'industry','relaxed',12000,true);
 const holdoutA=outageMatrix?7001:2477,holdoutB=outageMatrix?9871:5347;
 pair(holdoutA,'logistics','standard',9000,false,'holdout');
 pair(holdoutA,'industry','relaxed',12000,true,'holdout');
 pair(holdoutB,'industry','veteran',9000,false,'holdout');
 pair(holdoutB,'early_defense','standard',9000,false,'holdout');
 pair(holdoutB,'industry','relaxed',12000,true,'holdout');
 for(const policy of ['single','early_defense','no_artillery','mortars','harbor'])add(holdoutA,policy,'standard',9000,false,'holdout');
}else if(fallbackMatrix){
 function pair(seed,policy,difficulty,horizon=9000,endless=false,group='comparison',power='base'){
  for(const fallback of [false,true])add(seed,policy,difficulty,horizon,endless,group,false,false,false,power==='marine',power==='coal',fallback);
 }
 pair(6197,'industry','relaxed',12000,true,'prior-stall','marine');
 pair(6197,'industry','relaxed',12000,true,'prior-stall','coal');
 pair(417,'industry','relaxed',12000,true,'comparison','marine');
 pair(417,'industry','relaxed',12000,true,'comparison','coal');
 pair(1913,'industry','standard',9000,false,'comparison','marine');
 pair(1913,'industry','standard',9000,false,'comparison','coal');
 pair(9419,'no_artillery','standard',9000,false,'prior-stall');
 pair(8813,'logistics','standard',9000,false,'prior-stall');
 pair(1967,'industry','standard');
 pair(4297,'mortars','veteran');
 pair(6619,'industry','relaxed',12000,true,'holdout','marine');
 pair(6619,'industry','relaxed',12000,true,'holdout','coal');
 pair(6619,'pulse','standard',9000,false,'holdout');
 pair(2731,'logistics','standard',9000,false,'holdout');
 pair(2731,'industry','veteran',9000,false,'holdout','marine');
 for(const policy of ['single','early_defense','no_artillery','mortars','harbor'])add(2731,policy,'standard',9000,false,'holdout');
}else if(coalPowerMatrix){
 function pair(seed,difficulty,horizon=9000,endless=false,group='comparison'){
  add(seed,'industry',difficulty,horizon,endless,group,false,false,false,true);
  add(seed,'industry',difficulty,horizon,endless,group,false,false,false,false,true);
 }
 for(const seed of [417,2026,1967,8813])pair(seed,'standard');
 pair(4297,'veteran');
 pair(417,'relaxed',72000,true);
 pair(4297,'relaxed',72000,true);
 pair(2801,'standard',72000,true);
 pair(1807,'veteran');
 for(const seed of [1913,6197]){
  pair(seed,'standard',9000,false,'holdout');
  pair(seed,'veteran',9000,false,'holdout');
  pair(seed,'relaxed',72000,true,'holdout');
 }
 for(const policy of ['pulse','mortars','logistics','early_defense','single'])add(1913,policy,'standard',9000,false,'holdout');
}else if(marineMatrix){
 function pair(seed,difficulty,horizon=9000,endless=false,group='comparison'){
  add(seed,'industry',difficulty,horizon,endless,group);
  add(seed,'industry',difficulty,horizon,endless,group,false,false,false,true);
 }
 for(const seed of [417,2026,1967,8813])pair(seed,'standard');
 pair(417,'relaxed');
 pair(4297,'veteran');
 pair(417,'relaxed',72000,true);
 pair(4297,'relaxed',72000,true);
 pair(2801,'standard',72000,true);
 for(const seed of [1807,6113]){
  pair(seed,'standard',9000,false,'holdout');
  pair(seed,'veteran',9000,false,'holdout');
  pair(seed,'relaxed',72000,true,'holdout');
 }
 for(const policy of ['pulse','mortars','logistics','early_defense','single'])add(1807,policy,'standard',9000,false,'holdout');
}else if(industryTrial){
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
 const {seed,policy,difficulty,horizon,endless,group,shedLoad,powerReserve,coalReserve,marineTrial,coalPowerTrial,sentryFallback,repairReserve}=job;
 const outageReserve=outageMatrix&&repairReserve;
 const rebuildPriority=job.rebuildPriority??false;
 const stem=`campaign-${policy}-${seed}${difficulty==='standard'?'':'-'+difficulty}-${horizon}${endless?'-endless':''}${shedLoad?'-shed-load':''}${powerReserve?'-reserve':''}${coalReserve?'-fuel':''}${marineTrial?'-marine':''}${coalPowerTrial?'-coal-power':''}${sentryFallback?'-fallback':''}${outageReserve?'-outage-reserve':repairReserve?'-repair-reserve':''}${recoveryMatrix?'-power-recovery':''}${originMatrix?'-power-origin':''}${rebuildPriority?'-priority':''}${leadMatrix?'-reserve-lead':''}`;
 const reportPath=`work/${stem}.json`;
 async function readReport(){
  const report=JSON.parse(await readFile(reportPath,'utf8'));
  for(const key of ['seed','policy','difficulty','horizon','endless']){
   if(report[key]!==job[key])throw Error(`Checkpoint mismatch for ${stem}: ${key}`);
  }
  if((report.shedLoad??false)!==shedLoad||(report.powerReserve??false)!==powerReserve||(report.coalReserve??false)!==coalReserve||(report.marineTrial??false)!==marineTrial||(report.coalPowerTrial??false)!==coalPowerTrial||(report.sentryFallback??false)!==sentryFallback||(report.repairReserve??false)!==repairReserve||(report.outageReserve??false)!==outageReserve||(report.recoveryTelemetry??false)!==recoveryMatrix||(report.powerOrigin??false)!==originMatrix||(report.rebuildPriority??false)!==rebuildPriority||(report.reserveLead??false)!==leadMatrix)throw Error(`Power policy mismatch for ${stem}`);
  return {...report,group};
 }
 if(resume){
  try{return await readReport();}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const log=await open(`${dir}/${stem}.log`,'w');
 try{
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/play-campaign.mjs',String(seed),policy,difficulty,String(horizon),endless?'endless':'campaign'],{env:{...process.env,CAMPAIGN_SHED_LOAD:shedLoad?'1':'0',CAMPAIGN_POWER_RESERVE:powerReserve?'1':'0',CAMPAIGN_COAL_RESERVE:coalReserve?'1':'0',CAMPAIGN_MARINE:marineTrial?'1':'0',CAMPAIGN_COAL_POWER:coalPowerTrial?'1':'0',CAMPAIGN_SENTRY_FALLBACK:sentryFallback?'1':'0',CAMPAIGN_REPAIR_RESERVE:outageReserve?'outage':repairReserve?'1':'0',CAMPAIGN_POWER_RECOVERY:recoveryMatrix?'1':'0',CAMPAIGN_POWER_ORIGIN:originMatrix?'1':'0',CAMPAIGN_REBUILD_PRIORITY:rebuildPriority?'1':'0',CAMPAIGN_RESERVE_LEAD:leadMatrix?'1':'0'},stdio:['ignore',log.fd,log.fd]});
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
  console.log(`${report.difficulty} ${report.policy} ${report.seed} ${report.horizon} ${report.coalPowerTrial?'coal':report.marineTrial?'marine':report.powerReserve?'reserve':report.shedLoad?'shed':'control'}${report.sentryFallback?' fallback':''}${report.repairReserve?' repair-reserve':''}: ${report.outcome}, swarm ${report.wave}, ${report.kills} kills`);
 }
}
await Promise.all(Array.from({length:workers},worker));
await writeFile(`${dir}/results.json`,JSON.stringify(reports,null,2));
