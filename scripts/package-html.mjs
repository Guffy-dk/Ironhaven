import {Script} from 'node:vm';
export function packageHtml(source,{script,css,license,icon}){
 // Function replacements preserve literal $&, $`, $' and $1 inside generated code.
 // Replacement-string expansion can otherwise silently corrupt a minified bundle.
 const escapedScript=script.replace(/<\/script/gi,()=>'<\\/script');
 const html=source
  .replace('<link rel="icon" type="image/svg+xml" href="./favicon.svg">',()=>icon)
  .replace('<meta charset="UTF-8">',()=>`<meta charset="UTF-8"><!-- Three.js license:\n${license}\n-->`)
  .replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>',()=>`<script>${escapedScript}</script>`);
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 if(scripts.length!==1||scripts[0][1].trim()||scripts[0][2]!==escapedScript)throw Error('Standalone HTML must contain exactly the unmodified bundled script, with no external loader.');
 new Script(scripts[0][2],{filename:'Ironhaven.inline.js'});
 return html;
}
