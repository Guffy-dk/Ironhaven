// Draggable modeless panels and modal dialogs, with viewport clamping and saved positions.
export function initWindows(){
 const STORAGE='ironhaven.windows.v1';let stored={};try{stored=JSON.parse(localStorage.getItem(STORAGE)||'{}');}catch{}
 let drag=null,z=8;
 const persist=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(stored));}catch{}};
 function position(el,x,y){const r=el.getBoundingClientRect(),w=r.width||parseFloat(el.style.width)||220,h=r.height||180;el.style.width=w+'px';el.style.position='fixed';el.style.margin='0';el.style.right='auto';el.style.bottom='auto';el.style.left=Math.max(6,Math.min(innerWidth-Math.min(w,innerWidth)+2,x))+'px';el.style.top=Math.max(6,Math.min(innerHeight-Math.min(h,innerHeight)+2,y))+'px';}
 for(const el of document.querySelectorAll('.floating-window,dialog')){
  const handle=el.querySelector('.window-handle')||el.querySelector('h2');if(!handle)continue;handle.classList.add('draggable-handle');
  if(stored[el.id]){if(stored[el.id].width)el.style.width=stored[el.id].width+'px';position(el,stored[el.id].x,stored[el.id].y);}
  handle.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,input,a'))return;const r=el.getBoundingClientRect();drag={el,ox:e.clientX-r.left,oy:e.clientY-r.top};el.style.zIndex=String(++z);e.preventDefault();});
  el.addEventListener('pointerdown',()=>{el.style.zIndex=String(++z);});
 }
 window.addEventListener('pointermove',e=>{if(drag)position(drag.el,e.clientX-drag.ox,e.clientY-drag.oy);});
 window.addEventListener('pointerup',()=>{if(!drag)return;stored[drag.el.id]={x:parseFloat(drag.el.style.left),y:parseFloat(drag.el.style.top),width:parseFloat(drag.el.style.width)};persist();drag=null;});
 window.addEventListener('resize',()=>{for(const el of document.querySelectorAll('.floating-window,dialog'))if(stored[el.id]){if(stored[el.id].width)el.style.width=stored[el.id].width+'px';position(el,stored[el.id].x,stored[el.id].y);}});
 for(const btn of document.querySelectorAll('[data-window-close]'))btn.onclick=()=>{document.getElementById(btn.dataset.windowClose).hidden=true;};
 for(const btn of document.querySelectorAll('[data-window-minimize]'))btn.onclick=()=>document.getElementById(btn.dataset.windowMinimize).classList.toggle('window-minimized');
 for(const btn of document.querySelectorAll('[data-window-toggle]'))btn.onclick=()=>{const el=document.getElementById(btn.dataset.windowToggle);
 if(el.id==='intel'&&!el.classList.contains('has-selection')){
  const visible=!el.hidden&&el.classList.contains('inspector-pinned');
  el.hidden=visible;
  el.classList.toggle('inspector-pinned',!visible);
 }else el.hidden=!el.hidden;};
 document.getElementById('reset-windows').onclick=()=>{stored={};persist();for(const el of document.querySelectorAll('.floating-window,dialog')){for(const key of['position','margin','left','right','top','bottom','zIndex','width','height'])el.style[key]='';el.classList.remove('window-minimized','inspector-pinned');if(el.classList.contains('floating-window'))el.hidden=false;}};
}
