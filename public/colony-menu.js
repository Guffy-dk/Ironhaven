const PAGES={home:['Colony menu',null],saves:['Save & load','home'],settings:['Settings','home'],controls:['Controls','settings'],audio:['Audio','settings'],graphics:['Graphics','settings'],interface:['Interface','settings'],multiplayer:['Multiplayer','home'],colony:['Colony tools','home'],support:['Help & about','home']};
export function initColonyMenu(dialog,onOpen=()=>{}){
 let page='home';const back=dialog.querySelector('#menu-back'),title=dialog.querySelector('#menu-title');
 function show(next,focus=true){
  page=Object.hasOwn(PAGES,next)?next:'home';
  for(const section of dialog.querySelectorAll('[data-menu-page]'))section.hidden=section.dataset.menuPage!==page;
  title.textContent=PAGES[page][0];back.hidden=page==='home';back.setAttribute('aria-label','Back to '+(PAGES[PAGES[page][1]]?.[0]??'game'));
  if(focus){const section=dialog.querySelector(`[data-menu-page="${page}"]`);(section.querySelector('button,input,select,a')??back).focus();}
 }
 for(const button of dialog.querySelectorAll('[data-menu-target]'))button.onclick=()=>show(button.dataset.menuTarget);
 function escape(){if(page==='home')dialog.close();else show(PAGES[page][1]);}
 back.onclick=escape;
 dialog.addEventListener('cancel',event=>{event.preventDefault();escape();});
 return {open(){onOpen();show('home',false);if(!dialog.open)dialog.showModal();dialog.querySelector('#continue').focus();},escape,show};
}
