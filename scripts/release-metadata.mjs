import { readFile } from 'node:fs/promises';
import {CURRENT_VERSION,RELEASE_STAGE,RELEASES,displayVersion} from '../public/shared/releases.js';
export async function validateRelease(){
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 if(pkg.version!==CURRENT_VERSION)throw Error('package.json and the in-game release version must match.');
 if(RELEASES[0]?.version!==CURRENT_VERSION||!RELEASES[0]?.changes?.length)throw Error('Every release and patch needs its own patch-note entry.');
 if(RELEASE_STAGE!=='stable'&&!CURRENT_VERSION.startsWith('0.'))throw Error('Pre-release development stays on 0.x until the first full release is explicitly marked stable.');
 const seen=new Set();let previous=null;
 for(const r of RELEASES){if(seen.has(r.version)||!/^\d+\.\d+\.\d+$/.test(r.version)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!r.title||r.changes.length===0)throw Error('Invalid release-history entry: '+r.version);seen.add(r.version);const nums=r.version.split('.').map(Number);if(previous){let order=0;for(let i=0;i<3;i++){if(previous[i]!==nums[i]){order=Math.sign(previous[i]-nums[i]);break;}}if(order<=0)throw Error('Patch notes must be newest first.');}previous=nums;}
 if(process.env.GITHUB_REF_TYPE==='tag'&&process.env.GITHUB_REF_NAME!=='v'+CURRENT_VERSION)throw Error('Release tag must match the version being built.');
 return RELEASES[0];
}
export function releaseMarkdown(entry){return `# Ironhaven ${displayVersion(entry.version)} — ${entry.title}\n\n${entry.date} · ${RELEASE_STAGE}\n\nDownload **Ironhaven.html** and open it directly in Chrome, Edge or Firefox. No installation or server app required.\n\n## Changes\n\n${entry.changes.map(c=>'- '+c).join('\n')}\n\nLAN: start or resume a world → Menu → Open world to LAN. Exchange one invitation and answer per guest. Up to four players. All players must use the same version.\n\nDirect LAN networking only; reliable internet play requires additional STUN/TURN infrastructure.\n\nVerification: automated gameplay, interface-logic and direct four-peer networking tests. Visual browser QA and separate physical LAN computers have not been tested in the build environment.\n`;}
