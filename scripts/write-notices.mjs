// Builds release/THIRD-PARTY-NOTICES.txt: every third-party component and art source that ships with
// the game, with its licence text or attribution. Steam release depends on this being complete;
// test/licensing.test.mjs checks it against the actual dependencies and asset manifests.
import {readFile,writeFile} from 'node:fs/promises';

const read=path=>readFile(path,'utf8');
export const RUNTIME_DEPENDENCIES=['three','fengari'];

export async function noticeText(){
 const pkg=JSON.parse(await read('package.json'));
 const deps=Object.keys(pkg.dependencies??{});
 const manifest=JSON.parse(await read('assets/manifest.json'));
 const thirdParty=JSON.parse(await read('docs/design/third-party-assets.json'));
 const section=(title,body)=>`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}\n\n${body.trim()}\n`;
 let text=`Ironhaven — third-party notices\n\nIronhaven is © its owner. All rights reserved. The components below are used under their own licences.\n`;
 text+=section('Electron and Chromium (MIT, BSD and others)',`The game runs on Electron (MIT). Electron's licence is in LICENSE and the Chromium licences are in LICENSES.chromium.html, both next to the game executable.
Ironhaven ships Electron's open-source ffmpeg build (LGPL-2.1, no patent-encumbered codecs). It is a separately replaceable shared library (libffmpeg.so / ffmpeg.dll). Source: https://github.com/electron/electron/releases`);
 text+=section('three.js (MIT)',await read('node_modules/three/LICENSE'));
 text+=section('Fengari Lua VM and bundled dependencies (MIT, BSD-3-Clause)',await read('release/FENGARI-LICENSE.txt'));
 text+=section('Fonts (SIL Open Font License 1.1)',await read('release/FONT-LICENSES.txt'));
 text+=section('CC0 textures and sky (Poly Haven)',`Public domain dedication (CC0 1.0): https://creativecommons.org/publicdomain/zero/1.0/\n\n`+manifest.assets.map(a=>`${a.id}: ${a.source}`).join('\n'));
 text+=section('CC0 creature bases (Grab3D) and AI provenance',await read('docs/design/THIRD_PARTY_ASSETS.txt'));
 const unknown=deps.filter(d=>!RUNTIME_DEPENDENCIES.includes(d));
 if(unknown.length)throw Error(`Add notices for new runtime dependencies: ${unknown.join(', ')}`);
 if(!thirdParty)throw Error('third-party-assets.json is missing');
 return text;
}

if(import.meta.url===`file://${process.argv[1]}`){await writeFile('release/THIRD-PARTY-NOTICES.txt',await noticeText());console.log('wrote release/THIRD-PARTY-NOTICES.txt');}
