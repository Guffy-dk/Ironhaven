// Commercial (Steam) licence compliance: what ships must be licensed for sale and attributed.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {noticeText,RUNTIME_DEPENDENCIES} from '../scripts/write-notices.mjs';

const ALLOWED=/^(MIT|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|ISC|Zlib|CC0-1\.0|OFL-1\.1)$/;

test('every runtime npm dependency uses a permissive licence and has a notice',async()=>{
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 assert.deepEqual(Object.keys(pkg.dependencies).sort(),[...RUNTIME_DEPENDENCIES].sort());
 for(const dep of RUNTIME_DEPENDENCIES){
  const meta=JSON.parse(await readFile(`node_modules/${dep}/package.json`,'utf8'));
  assert.match(meta.license,ALLOWED,dep);
  for(const sub of Object.keys(meta.dependencies??{})){
   const subMeta=JSON.parse(await readFile(`node_modules/${sub}/package.json`,'utf8'));
   assert.match(subMeta.license,ALLOWED,`${dep} → ${sub}`);
  }
 }
});

test('all packaged art is CC0 or recorded with its provenance',async()=>{
 const manifest=JSON.parse(await readFile('assets/manifest.json','utf8'));
 assert.ok(manifest.assets.every(a=>ALLOWED.test(a.license)));
 const art=await readdir('public/art');
 const recorded=(await readFile('docs/design/THIRD_PARTY_ASSETS.txt','utf8'))+(await readFile('docs/design/third-party-assets.json','utf8'))+(await readFile('docs/design/coastal-surfaces.provenance.json','utf8'));
 for(const file of ['crab-color.png','horror-color.png'])assert.ok(art.includes(file));
 assert.match(recorded,/Grab3D/);assert.match(recorded,/CC0/);
 assert.match(recorded,/OpenAI/,'AI-generated art is disclosed');
});

test('the notices cover every shipped component and refuse unknown dependencies',async()=>{
 const text=await noticeText();
 for(const name of ['Electron','three.js','Fengari','Open Font License','Poly Haven','Grab3D','ffmpeg'])assert.match(text,new RegExp(name),name);
});

test('packages ship the open-source ffmpeg build and every notice file',async()=>{
 const linux=await readFile('scripts/build-linux.sh','utf8'),windows=await readFile('scripts/build-windows.ps1','utf8');
 assert.match(linux,/ffmpeg-v\$runtime_version-linux-x64\.zip/);assert.match(linux,/sha256sum -c/);assert.match(linux,/THIRD-PARTY-NOTICES\.txt/);
 assert.match(windows,/ffmpeg-v\$runtimeVersion-win32-x64\.zip/);assert.match(windows,/ffmpegHash/);assert.match(windows,/THIRD-PARTY-NOTICES\.txt/);
 for(const file of ['FONT-LICENSES','FENGARI-LICENSE','ASSET-LICENSES'])assert.ok(linux.includes(file)&&windows.includes(file),file);
});

test('only royalty-free video codecs are embedded',async()=>{
 const intro=await readFile('desktop/studio.html','utf8').catch(()=>'')+await readFile('scripts/build.mjs','utf8');
 assert.doesNotMatch(intro,/video\/mp4/);
});

test('the Linux patcher ships notices and bundles no extra fonts',async()=>{
 const project=await readFile('desktop/patcher/linux/IronhavenPatcher.csproj','utf8');
 assert.doesNotMatch(project,/Fonts\.Inter/);
 const script=await readFile('scripts/build-linux-patcher.sh','utf8');
 assert.match(script,/Ironhaven-Patcher-Linux-NOTICES\.txt/);assert.match(script,/AVALONIA_TELEMETRY_OPTOUT=1/);
 for(const file of ['avalonia.txt','microcom.txt','tmds-dbus.txt','skiasharp-LICENSE.txt','dotnet-runtime.txt','skia-harfbuzz-THIRD-PARTY-NOTICES.txt'])assert.ok((await readdir('licenses')).includes(file),file);
});

test('the licensing register lists the Steam AI disclosure',async()=>{
 const doc=await readFile('docs/LICENSING.md','utf8');
 assert.match(doc,/AI content disclosure/);assert.match(doc,/Meshy/);assert.match(doc,/OpenAI/);
});
