// Full campaigns use only ordinary player commands. Independent runs share no state.
import {spawn} from 'node:child_process';import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
await mkdir('work/campaign-matrix',{recursive:true});
const jobs=[...[417,2026,7].flatMap(seed=>['standard','relaxed','veteran'].map(d=>[seed,'industry',d])),...[417,2026,7].map(seed=>[seed,'pulse','standard']),[99,'industry','standard'],[417,'single','standard'],[417,'no_artillery','standard']];
const resumeAt=Number(process.env.CAMPAIGN_START_AT||0);if(!Number.isInteger(resumeAt)||resumeAt<0||resumeAt>jobs.length)throw Error('Invalid CAMPAIGN_START_AT');
let next=resumeAt;const reports=[];
async function reportFor([seed,policy,difficulty]){return JSON.parse(await readFile(`work/campaign-${policy}-${seed}${difficulty==='standard'?'':'-'+difficulty}.json`,'utf8'));}
for(const job of jobs.slice(0,resumeAt)){const report=await reportFor(job);if(!['victory','defeat'].includes(report.outcome))throw Error('Cannot resume past an unfinished campaign');reports.push(report);}
async function worker(){while(next<jobs.length){const [seed,policy,difficulty]=jobs[next++],log=await open(`work/campaign-matrix/${seed}-${policy}-${difficulty}.log`,'w');try{await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/play-campaign.mjs',String(seed),policy,difficulty],{stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Campaign ${seed}/${policy}/${difficulty} exited ${code}`)));});}finally{await log.close();}const report=await reportFor([seed,policy,difficulty]);reports.push(report);console.log(`${difficulty} ${policy} ${seed}: ${report.outcome}, swarm ${report.wave}, ${report.kills} kills`);}}
const workers=Number(process.env.CAMPAIGN_WORKERS||2);if(!Number.isInteger(workers)||workers<1||workers>8)throw Error('CAMPAIGN_WORKERS must be from 1 to 8');
await Promise.all(Array.from({length:workers},()=>worker()));reports.sort((a,b)=>a.difficulty.localeCompare(b.difficulty)||a.policy.localeCompare(b.policy)||a.seed-b.seed);await writeFile('work/campaign-matrix/results.json',JSON.stringify(reports,null,2));
