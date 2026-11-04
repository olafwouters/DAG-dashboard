/* Compact shared workspace and shared, stable-ID bucket header colours. */
(()=>{
'use strict';
const palette=['#7b9fc8','#a895c9','#74b5ac','#d3b26b','#d69a78','#8cad8b','#8a9dbe','#c79baf'];
const valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
function bucketColour(id){const chosen=state.bucketColours?.[String(id)];return valid(chosen)?chosen:palette[id%palette.length];}
function tint(hex){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*.12+255*.88).toString(16).padStart(2,'0')).join('');}
function setBucketColour(id,value){
 if(!document.documentElement.classList.contains('dag-authenticated')||!state.buckets.some(b=>b.id===id)||value!==null&&!valid(value))return;
 const colours=Object.fromEntries(Object.entries(state.bucketColours||{}).filter(([key,v])=>/^\d+$/.test(key)&&valid(v)));
 if(value===null)delete colours[String(id)];else colours[String(id)]=value.toLowerCase();
 state.bucketColours=colours;save();render();
}
const popup=document.createElement('div');popup.className='bucket-colour-picker';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-labelledby','bucketColourTitle');
popup.innerHTML='<div class="bucket-colour-heading"><strong id="bucketColourTitle">Bucketkleur</strong><button type="button" id="bucketColourClose" aria-label="Sluiten">×</button></div><div id="bucketColourSwatches" class="bucket-colour-swatches"></div><label class="bucket-custom-colour">Eigen kleur<input type="color" id="bucketCustomColour"></label><button type="button" id="bucketColourReset">Standaardkleur</button>';
document.body.append(popup);let selectedId=null,opener=null;
function closePicker(){const wasOpen=!popup.hidden;popup.hidden=true;selectedId=null;if(wasOpen&&opener?.isConnected)opener.focus();}
function openPicker(id,button){
 if(!document.documentElement.classList.contains('dag-authenticated'))return;
 selectedId=id;opener=button;const colour=bucketColour(id).toLowerCase();
 $('bucketColourSwatches').innerHTML=palette.map(c=>'<button type="button" data-colour="'+c+'" style="background:'+c+'" aria-label="Kies kleur '+c+'" aria-pressed="'+(c===colour)+'">'+(c===colour?'✓':'')+'</button>').join('');
 $('bucketCustomColour').value=colour;popup.hidden=false;
 const rect=button.getBoundingClientRect();popup.style.left=Math.max(12,Math.min(rect.left,innerWidth-258))+'px';popup.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-250))+'px';$('bucketColourClose').focus();
}
function paintBucketHeaders(){
 for(const th of $('plannerTable').querySelectorAll('thead th[data-bucket]')){
  const id=Number(th.dataset.bucket),colour=bucketColour(id);th.style.setProperty('--bucket-accent',colour);th.style.setProperty('--bucket-tint',tint(colour));
  if(!th.querySelector('[data-bucket-colour]')){const button=document.createElement('button');button.type='button';button.className='bucket-palette-button';button.dataset.bucketColour=String(id);button.textContent='◉';button.title='Bucketkleur kiezen';button.setAttribute('aria-label','Kleur voor '+bucketName(id));th.querySelector('.bucket-top').append(button);}
 }
 const chip=document.getElementById('dagCatalogueChip');if(chip)chip.textContent=state.programs.filter(p=>recordType(p)==='programme').length+' opleidingen · '+state.programs.filter(p=>recordType(p)==='organisation').length+' onderdelen';
}
const priorPlanner=renderPlanner;renderPlanner=function(ps){priorPlanner(ps);paintBucketHeaders();};
document.addEventListener('click',event=>{const button=event.target.closest('[data-bucket-colour]');if(button){openPicker(Number(button.dataset.bucketColour),button);return;}if(!popup.hidden&&!popup.contains(event.target))closePicker();});
popup.addEventListener('click',event=>{const swatch=event.target.closest('[data-colour]');if(swatch&&selectedId!==null){setBucketColour(selectedId,swatch.dataset.colour);closePicker();}});
$('bucketCustomColour').onchange=event=>{if(selectedId!==null){setBucketColour(selectedId,event.target.value);closePicker();}};
$('bucketColourReset').onclick=()=>{if(selectedId!==null){setBucketColour(selectedId,null);closePicker();}};
$('bucketColourClose').onclick=closePicker;document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!popup.hidden)closePicker();});window.addEventListener('resize',closePicker);
const header=document.querySelector('header'),panel=document.querySelector('.dag-sync-panel'),account=document.createElement('div');account.className='dag-account-actions';
const line=document.createElement('div');line.className='dag-account-line';
const chip=document.createElement('span');chip.id='dagCatalogueChip';chip.className='dag-catalogue-chip';line.append(chip);
const tools=document.createElement('details');tools.className='dag-tools-menu';const summary=document.createElement('summary');summary.textContent='Gegevens';tools.append(summary);const menu=document.createElement('div');menu.className='dag-tools-content';
const originalActions=document.querySelector('.header-actions');if(originalActions)menu.append(originalActions);
for(const id of ['dagReload','dagDraft','dagRetry'])menu.append($(id));
$('dagReload').textContent='Gedeelde versie opnieuw ophalen';$('dagDraft').textContent='Herstelkopieën downloaden';tools.append(menu);line.append(tools,$('dagLogout'));account.append(line,$('dagStatus'));header.append(account);
if(panel?.querySelector('h2'))panel.querySelector('h2').textContent='Inloggen';if(panel?.querySelector('p.small'))panel.querySelector('p.small').remove();
render();
})();
