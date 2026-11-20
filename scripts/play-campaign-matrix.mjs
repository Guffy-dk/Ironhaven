// Full campaigns use only ordinary player commands. Independent runs share no state.
import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';

const dir='work/campaign-matrix';
await mkdir(dir,{recursive:true});
const jobs=[];
function add(seed,policy,difficulty,horizon=9000,endless=false,group='baseline'){
 jobs.push({seed,policy,difficulty,horizon,endless,group});
}
for(const seed of [417,2026,7]){
 for(const difficulty of ['relaxed','standard','veteran'])add(seed,'industry',difficulty);
 for(const policy of ['single','pulse','no_artillery','early_defense','mortars','logistics'])add(seed,policy,'standard');
}
for(const policy of ['industry','pulse','early_defense','mortars','logistics'])add(2801,policy,'standard',9000,false,'holdout');
add(417,'industry','relaxed',72000,true);
add(2026,'logistics','standard',72000,true);
add(6823,'industry','veteran',72000,true,'holdout');

const workers=Number(process.env.CAMPAIGN_WORKERS||2);
const resume=process.env.CAMPAIGN_RESUME==='1';
if(!Number.isInteger(workers)||workers<1||workers>8)throw Error('CAMPAIGN_WORKERS must be from 1 to 8');
let next=0;
const reports=[];
async function run(job){
 const {seed,policy,difficulty,horizon,endless,group}=job;
 const stem=`campaign-${policy}-${seed}${difficulty==='standard'?'':'-'+difficulty}-${horizon}${endless?'-endless':''}`;
 const reportPath=`work/${stem}.json`;
 async function readReport(){
  const report=JSON.parse(await readFile(reportPath,'utf8'));
  for(const key of ['seed','policy','difficulty','horizon','endless']){
   if(report[key]!==job[key])throw Error(`Checkpoint mismatch for ${stem}: ${key}`);
  }
  return {...report,group};
 }
 if(resume){
  try{return await readReport();}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const log=await open(`${dir}/${stem}.log`,'w');
 try{
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/play-campaign.mjs',String(seed),policy,difficulty,String(horizon),endless?'endless':'campaign'],{stdio:['ignore',log.fd,log.fd]});
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
  console.log(`${report.difficulty} ${report.policy} ${report.seed} ${report.horizon}: ${report.outcome}, swarm ${report.wave}, ${report.kills} kills`);
 }
}
await Promise.all(Array.from({length:workers},worker));
await writeFile(`${dir}/results.json`,JSON.stringify(reports,null,2));
