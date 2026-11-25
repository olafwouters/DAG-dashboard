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

/* Observe existing active classes; never intercept navigation. */
(()=>{
'use strict';
const nav=document.querySelector('.tabs');if(!nav)return;
const style=document.createElement('style');style.textContent='.tabs.dag-sliding-tabs{isolation:isolate}.tabs.dag-sliding-tabs .tab{z-index:1}.tabs.dag-sliding-tabs .tab.active{background:transparent!important;border-color:transparent!important;box-shadow:none!important;transform:none!important}.tabs.dag-sliding-tabs .tab.active:after{display:none}.dag-tab-indicator{position:absolute;left:0;top:0;z-index:0;pointer-events:none;box-sizing:border-box;border:1px solid #bbc2cb;border-radius:17px;background:linear-gradient(145deg,#fff 0,#fafbfd 42%,#f0f2f5 100%);box-shadow:0 5px 14px #2429321c,inset 0 2px 1px #fff,inset 0 -2px 2px #c1c7d04d;transition:transform 300ms cubic-bezier(.22,1,.36,1),width 300ms cubic-bezier(.22,1,.36,1),height 300ms cubic-bezier(.22,1,.36,1)}.dag-tab-indicator:not([data-ready]){transition:none}@media(prefers-reduced-motion:reduce){.dag-tab-indicator{transition:none!important}}@media print{.dag-tab-indicator{display:none}}';document.head.append(style);
const pill=document.createElement('span');pill.className='dag-tab-indicator';pill.setAttribute('aria-hidden','true');nav.prepend(pill);nav.classList.add('dag-sliding-tabs');
let frame=0;
function update(){frame=0;const active=nav.querySelector('.tab.active');if(!active||!active.getClientRects().length){pill.hidden=true;return;}pill.hidden=false;const r=active.getBoundingClientRect(),n=nav.getBoundingClientRect();pill.style.width=r.width+'px';pill.style.height=r.height+'px';pill.style.transform='translate('+(r.left-n.left-nav.clientLeft+nav.scrollLeft)+'px,'+(r.top-n.top-nav.clientTop+nav.scrollTop)+'px)';if(!pill.dataset.ready)requestAnimationFrame(()=>{pill.dataset.ready='true';});}
function schedule(){if(!frame)frame=requestAnimationFrame(update);}
new MutationObserver(schedule).observe(nav,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
const resize=new ResizeObserver(schedule);resize.observe(nav);nav.querySelectorAll('.tab').forEach(tab=>resize.observe(tab));
window.addEventListener('resize',schedule,{passive:true});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
if(document.fonts)document.fonts.ready.then(schedule);
schedule();
})();
