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
export function releaseMarkdown(entry){return `# Ironhaven ${displayVersion(entry.version)} — ${entry.title}\n\n${entry.date} · ${RELEASE_STAGE}\n\nWindows x64 and Linux x64 playtest. Windows: download **Ironhaven-Patcher.exe**, choose **Install latest**, then **Play Ironhaven**, or extract **Ironhaven-Windows-x64.zip** and open **Ironhaven.exe**. Linux: download **Ironhaven-Patcher-Linux**, make it executable, choose **Install latest**, then **Play Ironhaven**, or extract **Ironhaven-Linux-x64.tar.gz** and run **Ironhaven/ironhaven.sh**.\n\n## Changes\n\n${entry.changes.map(c=>'- '+c).join('\n')}\n\nCo-op: start or resume a world → Menu → Multiplayer. Exchange one invitation and answer per guest, over the internet or a local network, without port forwarding. Up to four players. All players must use the same version. Very strict NATs can still block direct connections.\n\nVerification: automated gameplay, interface and networking tests, Windows and Linux startup smoke tests and patcher validation on both platforms.\n`;}
