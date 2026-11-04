/* Bucket colours only. Native colour controls; existing data/save path is unchanged. */
(()=>{
'use strict';
const palette=['#7b9fc8','#a895c9','#74b5ac','#d3b26b','#d69a78','#8cad8b','#8a9dbe','#c79baf'];
const valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const defaultColour=id=>palette[id%palette.length];
function bucketColour(id){const value=state.bucketColours?.[String(id)];return valid(value)?value:defaultColour(id);}
function tint(hex){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*.12+255*.88).toString(16).padStart(2,'0')).join('');}
function nextId(){return Math.max(...state.buckets.map(b=>b.id))+1;}
function colourControl(id,name){
 const input=document.createElement('input');input.type='color';input.className='dag-bucket-colour';input.dataset.dagBucketColour=String(id);input.value=bucketColour(id);input.title='Kleur wijzigen: '+name;input.setAttribute('aria-label','Kleur voor '+name);return input;
}
function paintHeaders(){
 for(const th of $('plannerTable').querySelectorAll('thead th[data-bucket]')){
  const id=Number(th.dataset.bucket),colour=bucketColour(id);th.style.setProperty('--dag-bucket-colour',colour);th.style.setProperty('--dag-bucket-tint',tint(colour));
  if(!th.querySelector('[data-dag-bucket-colour]'))th.querySelector('.bucket-top').append(colourControl(id,bucketName(id)));
 }
}
function paintManager(){
 for(const row of $('bucketList').querySelectorAll('.bucket-list-row')){
  const move=row.querySelector('[data-move-bucket]');if(!move)continue;const id=Number(move.dataset.moveBucket);
  if(!row.querySelector('[data-dag-bucket-colour]'))row.querySelector('.bucket-list-name').before(colourControl(id,bucketName(id)));
 }
}
function storeColour(id,value){
 if(!document.documentElement.classList.contains('dag-authenticated')||!valid(value)||!state.buckets.some(b=>b.id===id))return false;
 const colour=value.toLowerCase();if(state.bucketColours?.[String(id)]===colour)return false;
 state.bucketColours={...Object.fromEntries(Object.entries(state.bucketColours||{}).filter(([key,c])=>/^\d+$/.test(key)&&valid(c))),[String(id)]:colour};return true;
}
function changeColour(id,value){if(!storeColour(id,value))return;save();render();if($('bucketDialog').open)renderBucketList();}
const oldPlanner=renderPlanner;renderPlanner=function(ps){oldPlanner(ps);paintHeaders();};
const oldManager=renderBucketList;renderBucketList=function(){oldManager();paintManager();};
const form=$('bucketForm'),label=document.createElement('label');label.className='dag-new-bucket-colour';
const caption=document.createElement('span');caption.textContent='Kleur';
const picker=document.createElement('input');picker.type='color';picker.id='dagNewBucketColour';picker.className='dag-bucket-colour';picker.value=defaultColour(nextId());picker.setAttribute('aria-label','Kleur voor nieuwe bucket');picker.title='Kleur voor nieuwe bucket';label.append(caption,picker);form.querySelector('button[type=submit]').before(label);
let creating=null;
form.addEventListener('submit',()=>{creating={ids:new Set(state.buckets.map(b=>b.id)),colour:picker.value};},true);
// The original handler creates and validates the bucket first. Attach colour only on success.
form.addEventListener('submit',()=>{
 const before=creating;creating=null;if(!before)return;const added=state.buckets.filter(b=>!before.ids.has(b.id));
 if(added.length===1&&storeColour(added[0].id,before.colour)){save();render();renderBucketList();picker.value=defaultColour(nextId());}
});
document.addEventListener('change',event=>{const input=event.target.closest('[data-dag-bucket-colour]');if(input)changeColour(Number(input.dataset.dagBucketColour),input.value);});
paintHeaders();if($('bucketDialog').open)paintManager();
})();
