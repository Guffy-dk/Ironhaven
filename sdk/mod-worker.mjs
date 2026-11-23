import {parentPort,workerData} from 'node:worker_threads';
import {compileMods} from './lua-mods.mjs';
try{parentPort.postMessage({result:compileMods(workerData.seed,workerData.packs)});}
catch(error){parentPort.postMessage({error:String(error.message)});}
