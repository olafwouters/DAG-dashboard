/* Status view: the same cells and save path as the planner matrix. */
(()=>{
'use strict';
const nav=document.querySelector('.tabs');
const tab=document.createElement('button');tab.type='button';tab.className='tab';tab.dataset.tab='statusboard';tab.textContent='▦ Statusoverzicht';nav.querySelector('[data-tab="dashboard"]').before(tab);
const section=document.createElement('section');section.id='statusboard';section.className='sectionhidden';
section.innerHTML='<div class="toolbar"><div><h2 style="margin-bottom:2px">Statusoverzicht</h2><span class="small">Dezelfde activiteiten als in de planner. Klik op een kaart om deze te bewerken, kies een status of versleep de kaart.</span></div></div><div class="status-controls"><label>Activiteit / bucket<select id="boardBucket"><option value="">Alle activiteiten</option></select></label><label class="check"><input type="checkbox" id="boardEmpty">Ook niet-ingevulde activiteiten tonen</label><label class="check"><input type="checkbox" id="boardNA">Niet van toepassing tonen</label><span id="boardCount" class="small push" role="status"></span></div><p class="small">Deadline verstreken wordt automatisch berekend. Een activiteit met een verlopen deadline staat alleen in die kolom, met behoud van de oorspronkelijke status. Niet-ingevulde cellen blijven standaard verborgen.</p><div id="statusBoard" class="status-board"></div>';
document.querySelector('main footer').before(section);
const lanes=[{key:'0',name:'Nog niet gestart',status:0},{key:'1',name:'Gepland',status:1},{key:'2',name:'Bezig',status:2},{key:'3',name:'Afgerond',status:3},{key:'overdue',name:'Deadline verstreken',status:null},{key:'4',name:'Niet van toepassing',status:4}];
function boardLane(c){return isOver(c)?'overdue':String(c.status);}
function boardItems(ps){
 const owner=$('ownerFilter').value.toLocaleLowerCase('nl'),bucket=$('boardBucket').value,items=[];
 for(const p of ps)for(const [name,b] of bucketEntries()){
  if(bucket!==''&&Number(bucket)!==b)continue;
  const c=cell(p,b),recorded=Object.prototype.hasOwnProperty.call(state.cells[p.id]||{},b);
  if(!recorded&&!$('boardEmpty').checked)continue;
  if(c.status===4&&!$('boardNA').checked)continue;
  if(owner&&!String(c.owner||'').toLocaleLowerCase('nl').includes(owner))continue;
  items.push({p,b,name,c,lane:boardLane(c)});
 }
 return items.sort((a,b)=>(a.c.due||'9999').localeCompare(b.c.due||'9999')||a.p.name.localeCompare(b.p.name,'nl')||a.name.localeCompare(b.name,'nl'));
}
function boardCard({p,b,name,c}){
 const overdue=isOver(c),kind=recordType(p)==='organisation'?'Organisatieonderdeel':'Opleiding';
 return `<article class="board-card ${overdue?'board-overdue':''}" draggable="true" data-board-card="true" data-record="${esc(p.id)}" data-bucket="${b}"><div class="board-card-top"><span class="badge">${esc(STATUS[c.status])}</span><span class="board-grip" aria-hidden="true">⠿</span></div><button type="button" class="board-open" data-id="${esc(p.id)}" data-b="${b}" aria-label="Bewerk ${esc(p.name+' — '+name)}"><span class="board-programme">${esc(p.name)}</span><span class="board-activity">${esc(name)}</span>${c.title?`<span class="board-title">${esc(c.title)}</span>`:''}<span class="small">${esc(kind+' · '+p.cluster)}</span><span class="board-owner">Eigenaar: ${esc(c.owner||'Nog niet toegewezen')}</span><span class="board-deadline ${overdue?'danger':''}">${c.due?(overdue?'⚑ Deadline verstreken: ':'Deadline: ')+dateFmt(c.due):'Geen deadline'}${c.status===3&&c.done?' · Afgerond: '+dateFmt(c.done):''}</span></button><label class="board-status-label">Status<select data-board-status="true" data-record="${esc(p.id)}" data-bucket="${b}" aria-label="Status voor ${esc(p.name+' — '+name)}">${STATUS.map((status,i)=>`<option value="${i}" ${c.status===i?'selected':''}>${esc(status)}</option>`).join('')}</select></label></article>`;
}
function renderStatusBoard(ps){
 const old=$('boardBucket').value;
 $('boardBucket').innerHTML='<option value="">Alle activiteiten</option>'+bucketEntries().map(([name,b])=>`<option value="${b}">${esc(name)}</option>`).join('');
 $('boardBucket').value=state.buckets.some(b=>String(b.id)===old)?old:'';
 const items=boardItems(ps),visibleLanes=lanes.filter(l=>l.key!=='4'||$('boardNA').checked),overdue=items.filter(x=>x.lane==='overdue').length;
 $('boardCount').textContent=items.length+' activiteiten · '+overdue+' deadlines verstreken';
 $('statusBoard').innerHTML=visibleLanes.map(l=>{const cards=items.filter(x=>x.lane===l.key);return `<section class="board-lane lane-${l.key}" ${l.status===null?'':`data-drop-status="${l.status}"`} aria-label="${l.name}"><div class="board-lane-head"><h3>${l.name}</h3><span class="badge">${cards.length}</span></div><div class="board-lane-items">${cards.length?cards.map(boardCard).join(''):'<p class="board-empty">Geen activiteiten in deze selectie.</p>'}</div>${l.status===null?'<p class="small board-lane-note">Pas de deadline aan via de kaart of rond de activiteit af.</p>':''}</section>`;}).join('');
}
function setBoardStatus(id,b,status){
 if(!document.documentElement.classList.contains('dag-authenticated'))return;
 const p=state.programs.find(p=>p.id===id);
 if(!p||!state.buckets.some(x=>x.id===b)||!Number.isInteger(status)||status<0||status>4)return;
 const c={...cell(p,b)};if(c.status===status)return;
 c.status=status;c.done=status===3?(c.done||today()):'';c.updated=new Date().toISOString();state.cells[id]??={};state.cells[id][b]=c;
 save();render();
 if(isOver(c))toast('Status bijgewerkt. De deadline is nog verstreken; pas deze aan via de kaart.');
}
function showPlannerTab(name){
 activeTab=name;
 for(const button of document.querySelectorAll('.tab')){const selected=button.dataset.tab===name;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));}
 for(const id of ['planner','statusboard','dashboard','help'])$(id).classList.toggle('sectionhidden',id!==name);
 $('filters').classList.toggle('sectionhidden',name==='help');
 if(name==='statusboard')renderStatusBoard(visible());
}
for(const button of document.querySelectorAll('.tab'))button.onclick=()=>showPlannerTab(button.dataset.tab);
for(const id of ['boardBucket','boardEmpty','boardNA'])$(id).onchange=()=>renderStatusBoard(visible());
section.addEventListener('change',event=>{const select=event.target.closest('[data-board-status]');if(select)setBoardStatus(select.dataset.record,Number(select.dataset.bucket),Number(select.value));});
let dragging=null;
function clearBoardDrop(){section.querySelectorAll('.board-drop-target').forEach(l=>l.classList.remove('board-drop-target'));}
section.addEventListener('dragstart',event=>{const card=event.target.closest('[data-board-card]');if(!card)return;if(event.target.closest('select,input')||!document.documentElement.classList.contains('dag-authenticated')){event.preventDefault();return;}dragging={id:card.dataset.record,b:Number(card.dataset.bucket)};event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',JSON.stringify(dragging));});
section.addEventListener('dragover',event=>{const lane=event.target.closest('[data-drop-status]');if(!dragging||!lane)return;event.preventDefault();event.dataTransfer.dropEffect='move';clearBoardDrop();lane.classList.add('board-drop-target');});
section.addEventListener('drop',event=>{const lane=event.target.closest('[data-drop-status]');if(!dragging||!lane)return;event.preventDefault();const move=dragging;dragging=null;clearBoardDrop();setBoardStatus(move.id,move.b,Number(lane.dataset.dropStatus));});
section.addEventListener('dragend',()=>{dragging=null;clearBoardDrop();});
let boardToday=today();
setInterval(()=>{const next=today();if(next!==boardToday){boardToday=next;render();}},60000);
const renderBeforeStatusBoard=render;
render=function(){renderBeforeStatusBoard();renderStatusBoard(visible());};
render();
})();
