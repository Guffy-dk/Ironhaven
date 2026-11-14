import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packageHtml} from '../scripts/package-html.mjs';
const source='<!doctype html><html><head><meta charset="UTF-8"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="stylesheet" href="./style.css"></head><body><script type="module" src="./app.js"></script></body></html>';
test('packaging preserves minified dollar expressions and escapes HTML script endings',()=>{
 const script="const $=true;$&&(()=>{})();const text=\"$& $` $' $1 </script> </SCRIPT>\";",css='body::after{content:"$&"}',html=packageHtml(source,{script,css,license:'MIT $&',icon:'<link rel="icon" href="data:image/svg+xml,test">'});
 assert.ok(html.includes('$&&(()=>{})()'));assert.ok(html.includes('$& $`'));assert.ok(html.includes('<\\/script>'));assert.ok(html.includes(css));assert.ok(html.includes('MIT $&'));assert.ok(!html.includes('src="./app.js"'));
});
test('packaging rejects invalid JavaScript and missing bundle insertion points',()=>{
 const args={script:'const okay=1;',css:'',license:'',icon:''};assert.throws(()=>packageHtml(source,{...args,script:'const = ;'}),SyntaxError);assert.throws(()=>packageHtml(source.replace('<script type="module" src="./app.js"></script>',''),args),/exactly/);
});
