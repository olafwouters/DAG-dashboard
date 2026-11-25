/* Activity-level Status board; no duplicate activity or trajectory records. */
(function(g){
'use strict';
const M=g.DAGStatusContainers,E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function move(s,entry,target,h){
 if(!h.allowed()||h.editing())return false;
 if(JSON.stringify(s.cells[entry.id]?.[entry.b])!==entry.before){h.warn('Activiteit is intussen gewijzigd. Probeer opnieuw.');return false;}
 const plan=M.planActivityMove(s,entry.id,entry.b,target,h.date(),h.timestamp());
 if(!plan||!plan.changed)return false;
 s.cells[entry.id][entry.b]=plan.next;h.save();h.render();return true;
}
function view(s,ids,filters={}){
 const model=M.groupActivities(s,{programmeIds:ids,includeNotApplicable:!!filters.na});
 return model.lanes.filter(l=>l.column.id!=='not-applicable'||filters.na).map(l=>({...l,containers:l.containers.map(c=>({...c,items:c.items.filter(i=>
  (filters.bucket==null||String(i.bucket.id)===String(filters.bucket))&&
  (!filters.owner||String(i.activity.owner||'').toLocaleLowerCase('nl').includes(filters.owner.toLocaleLowerCase('nl')))&&
  (!filters.attention||filters.attention(i.activity,c.programme)))})).filter(c=>c.items.length)}));
}
let ready=false,drag=null;const entries=new Map();
const hooks=()=>({allowed:()=>document.documentElement.classList.contains('dag-authenticated'),editing:()=>!!document.querySelector('dialog[open]'),date:today,timestamp:()=>new Date().toISOString(),save:()=>save(),render:()=>render(),warn:toast});
function init(host){
 if(ready)return;ready=true;
 const empty=document.getElementById('boardEmpty');empty.checked=false;empty.disabled=true;empty.closest('label').style.display='none';
 document.getElementById('statusboard').querySelector('.toolbar p').textContent='Activiteiten per opleiding/team en status. Alleen de activiteit wordt verplaatst; lege containers verdwijnen.';
 document.getElementById('boardNA').closest('label').lastChild.textContent='Ook Niet van toepassing';
 host.addEventListener('change',e=>{const n=e.target.closest('[data-activity-move]');if(!n)return;const entry=entries.get(n.dataset.activityMove);if(entry)move(state,entry,n.value,hooks());draw(visible());});
 host.addEventListener('dragstart',e=>{const n=e.target.closest('[data-activity-key]');if(!n||e.target.closest('button,select,input')||!hooks().allowed()||hooks().editing()){e.preventDefault();return;}drag=entries.get(n.dataset.activityKey);if(!drag){e.preventDefault();return;}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',n.dataset.activityKey);});
 host.addEventListener('dragover',e=>{if(drag&&e.target.closest('[data-activity-column]')&&hooks().allowed()){e.preventDefault();e.dataTransfer.dropEffect='move';}});
 host.addEventListener('drop',e=>{const n=e.target.closest('[data-activity-column]'),entry=drag;drag=null;if(!n||!entry)return;e.preventDefault();move(state,entry,n.dataset.activityColumn,hooks());});
 host.addEventListener('dragend',()=>drag=null);
}
function attention(a,p){
 const m=state.programmeTrajectories?.[p.id]||{};
 return isOver(a)||!m.action||!m.owner||!m.actionDue||(m.actionDue<today())||
  (m.condition&&m.condition!=='active'&&(!m.waitReason||!m.reviewDate||m.reviewDate<=today()));
}
function draw(programmes){
 const host=document.getElementById('statusBoard');if(!host)return;init(host);entries.clear();
 const menu=document.getElementById('boardBucket'),old=menu.value;
 menu.innerHTML='<option value="">Alle activiteiten</option>'+state.buckets.map(b=>'<option value="'+E(b.id)+'">'+E(b.name)+'</option>').join('');menu.value=state.buckets.some(b=>String(b.id)===old)?old:'';
 const lanes=view(state,programmes.filter(p=>!state.hiddenProgrammeTrajectories?.[p.id]).map(p=>p.id),{bucket:menu.value||null,owner:document.getElementById('ownerFilter').value,na:document.getElementById('boardNA').checked,attention:document.getElementById('boardAttention').checked?attention:null});
 const ids=new Set();let total=0;
 host.innerHTML=lanes.map(l=>{
  let count=0;const cards=l.containers.map(c=>{
   const p=c.programme;ids.add(p.id);count+=c.items.length;total+=c.items.length;
   return '<article class="board-card"><button type="button" class="board-open" data-programme="'+E(p.id)+'"><span class="board-programme">'+E(p.name)+'</span><span class="small">'+E(p.cluster)+'</span></button>'+c.items.map(i=>{
    const key=JSON.stringify([p.id,i.bucket.id]),a=i.activity;entries.set(key,{id:p.id,b:i.bucket.id,before:JSON.stringify(a)});
    return '<div class="programme-activity" draggable="true" data-activity-key="'+E(key)+'"><div><span aria-hidden="true">⠿ </span>'+E(a.title||i.bucket.name)+'<p class="small">'+E(l.column.label)+' · '+E(a.owner||'Geen eigenaar')+(isOver(a)?' · Deadline verstreken':'')+'</p><button type="button" data-id="'+E(p.id)+'" data-b="'+E(i.bucket.id)+'">Activiteit openen</button></div><label>Verplaatsen naar<select data-activity-move="'+E(key)+'">'+M.columnList.map(col=>'<option value="'+E(col.id)+'" '+(col.id===l.column.id?'selected':'')+'>'+E(col.label)+'</option>').join('')+'</select></label></div>';
   }).join('')+'</article>';
  }).join('');
  return '<section class="board-lane" data-activity-column="'+E(l.column.id)+'"><div class="board-lane-head"><h3>'+E(l.column.label)+'</h3><span class="badge">'+l.containers.length+' onderdelen · '+count+' activiteiten</span></div><div class="board-lane-items">'+(cards||'<p class="small">Geen activiteiten.</p>')+'</div></section>';
 }).join('');
 document.getElementById('boardCount').textContent=ids.size+' unieke onderdelen · '+total+' zichtbare activiteiten';
}
g.DAGActivityBoard=Object.freeze({move,view,render:draw});
if(typeof document!=='undefined')draw(visible());
})(globalThis);
