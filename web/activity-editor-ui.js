/* Presentation only: retain every existing input, value and event handler. */
(()=>{
'use strict';
const dialog=document.getElementById('editDialog');if(!dialog)return;
const css=document.createElement('style');css.textContent='#editDialog{font-size:16px;line-height:1.55;width:min(780px,94vw)}#editDialog label,#editDialog .small,#editDialog input,#editDialog select,#editDialog textarea,#editDialog button,#editDialog p,#editDialog legend{font-size:16px;line-height:1.55}#editDialog .dialoghead h2{font-size:22px}#editDialog label:has(#editParticipants),#editDialog label:has(#editTitle),#editDialog label:has(#editLink),#editDialog label:has(#editFollowUpDone){display:none!important}#editDialog .formgrid{gap:18px}#editDialog .product-step-fields{padding:18px;border-radius:14px}#editDialog .activity-step-settings{margin-top:16px}#editDialog .activity-step-settings>summary{cursor:pointer;color:#285f63;padding:8px 0}#editDialog .activity-step-settings label{margin-top:10px}#editDialog textarea{min-height:110px}@media(max-width:600px){#editDialog .formgrid{grid-template-columns:1fr}#editDialog .dialogbody{padding:20px}#editDialog .dialogactions{flex-wrap:wrap}}';document.head.append(css);
function renameLabel(id,text){const input=document.getElementById(id),label=input?.closest('label');if(!label)return;const node=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(node&&node.textContent!==text)node.textContent=text;}
function decorate(){
renameLabel('editNotes','Notities en afspraken');
renameLabel('plannerProductStep','Huidige stap');
const box=dialog.querySelector('.product-step-fields');
if(box){const legend=box.querySelector('legend');if(legend&&legend.textContent!=='Voortgang activiteit')legend.textContent='Voortgang activiteit';
if(!box.querySelector('.activity-step-settings')){const input=document.getElementById('plannerProductSteps'),label=input?.closest('label');if(label){renameLabel('plannerProductSteps','Stappen voor deze activiteit (gescheiden door puntkomma’s)');const details=document.createElement('details');details.className='activity-step-settings';const summary=document.createElement('summary');summary.textContent='Stappen aanpassen';details.append(summary,label);for(const p of [...box.querySelectorAll('p')])details.append(p);box.append(details);}}}
for(const p of dialog.querySelectorAll('p'))if(p.textContent.trim().startsWith('Wijzigingen worden automatisch opgeslagen na een korte pauze.'))p.textContent='Wijzigingen worden automatisch opgeslagen.';
}
decorate();let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;decorate();});}).observe(dialog,{childList:true,subtree:true});
})();
