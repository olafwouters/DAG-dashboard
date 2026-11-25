/* Header presentation only: preserve existing live controls and handlers. */
(function(){
'use strict';
const banner=document.getElementById('atlasBanner'),button=document.getElementById('atlasMotion'),header=document.querySelector('body>header');
if(!banner||!button||!header)return;
const originalParent=banner.parentElement;
const heading=header.querySelector('h1');
if(heading&&heading.textContent.trim()==='DAG Dashboard')heading.remove();
header.querySelectorAll('.brand').forEach(n=>{if(n.textContent.includes('DAG PROJECTWERKRUIMTE'))n.remove();});
header.querySelectorAll('p').forEach(n=>{if(n.textContent.trim()==='Digitale & AI-geletterdheid · Projectplanner & voortgang')n.remove();});
const title=banner.querySelector('.atlas-banner-title');
if(title){title.setAttribute('role','heading');title.setAttribute('aria-level','1');}
header.prepend(banner);
const controls=header.querySelector('.header-information-actions');
if(controls)banner.append(controls);
if(originalParent!==header&&!originalParent.textContent.trim()&&!originalParent.children.length)originalParent.remove();
button.addEventListener('click',function(){const paused=banner.dataset.paused!=='true';banner.dataset.paused=String(paused);button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Animatie hervatten':'Animatie pauzeren';});
const style=document.createElement('style');style.textContent='body>header{display:block;padding:0;background:transparent;border:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;overflow:visible}body>header .atlas-banner{display:grid;grid-template-columns:minmax(0,1fr) 180px auto;align-items:center;width:100%;max-width:none;min-width:0;margin:0 0 20px;border-radius:0 0 24px 24px;overflow:visible;padding:26px 32px;z-index:21}body>header .atlas-banner:before{display:none}body>header .atlas-banner .header-information-actions{position:relative;min-width:0;padding:0}body>header .atlas-banner .header-information-row{display:flex;flex-wrap:wrap;gap:10px}body>header .atlas-banner .header-information>summary,body>header .atlas-banner #dagLogout{background:rgba(255,253,249,.94);color:#303540;border-color:rgba(255,255,255,.7)}body>header .atlas-banner #dagStatus{color:#f1f3ed;max-width:320px;white-space:normal;overflow-wrap:anywhere}body>header .atlas-banner .header-information-content{color:#303540;background:#fffdf9;z-index:100;max-width:calc(100vw - 32px)}body>header .atlas-banner .atlas-banner-copy p{color:#f1f3ed}@media(max-width:900px){body>header .atlas-banner{grid-template-columns:minmax(0,1fr) 150px;padding:24px}.atlas-banner .header-information-actions{grid-column:1/-1}.atlas-banner .atlas-banner-art{justify-self:end}.atlas-banner .atlas-laptop{width:150px}}@media(max-width:600px){body>header .atlas-banner{grid-template-columns:minmax(0,1fr) 110px;padding:20px 16px}.atlas-banner .atlas-laptop{width:110px}body>header .atlas-banner #dagStatus{max-width:none}}@media(max-width:380px){body>header .atlas-banner{grid-template-columns:1fr}.atlas-banner .atlas-banner-art{display:none}body>header .atlas-banner .header-information-actions{grid-column:auto}}';document.head.append(style);
const processed=new WeakSet();
function increaseRules(rules){for(const rule of rules){if(rule.style){const value=rule.style.getPropertyValue('font-size').trim();if(/^[0-9]*\.?[0-9]+(px|pt)$/.test(value)){const priority=rule.style.getPropertyPriority('font-size');rule.style.setProperty('font-size','calc('+value+' + 2pt)',priority);}}if(rule.cssRules)increaseRules(rule.cssRules);}}
function increaseSheet(sheet){if(!sheet||processed.has(sheet))return;try{increaseRules(sheet.cssRules);processed.add(sheet);}catch(error){/* Cross-origin stylesheets cannot be edited. */}}
for(const sheet of document.styleSheets)increaseSheet(sheet);
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.tagName==='STYLE')increaseSheet(node.sheet);node.querySelectorAll('style').forEach(n=>increaseSheet(n.sheet));}});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
