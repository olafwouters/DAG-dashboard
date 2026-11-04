/* Layout only: move existing live nodes, preserving IDs and event handlers. */
(()=>{
'use strict';
const header=document.querySelector('body>header');
const panel=document.querySelector('.dag-sync-panel');
const logout=document.getElementById('dagLogout');
const login=document.getElementById('dagLogin');
const status=document.getElementById('dagStatus');
if(!header||!panel||!logout||!login||!status)return;
const controls=document.createElement('div');controls.className='header-information-actions';
const row=document.createElement('div');row.className='header-information-row';
const menu=document.createElement('details');menu.className='header-information';
const summary=document.createElement('summary');summary.textContent='Info & gegevens';
const content=document.createElement('div');content.className='header-information-content';
menu.append(summary,content);
row.append(menu,logout);
controls.append(row,status);
for(const node of [panel,document.querySelector('main .banner'),document.querySelector('main .catalogue-tools'),document.querySelector('.header-actions')])if(node)content.append(node);
header.append(controls);
// Only react to a real login-visibility transition, not to every save-status update.
let loginHidden=login.hidden;
menu.open=!loginHidden;
const observer=new MutationObserver(()=>{if(login.hidden===loginHidden)return;loginHidden=login.hidden;menu.open=!loginHidden;});
observer.observe(login,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;summary.focus();}});
})();
