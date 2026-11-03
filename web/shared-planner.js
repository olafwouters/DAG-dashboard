/* Shared DAG planner. Publishable key only; authorised sign-in is required. */
(async()=>{
'use strict';
const PROJECT_URL='https://xwbvlkkgydcdmgutmbqe.supabase.co';
const PUBLIC_KEY='sb_publishable_amz4avTueqT3VAS01x1Cnw_o1rgL2mZ';
const panel=document.createElement('section');panel.className='dag-sync-panel';
panel.innerHTML='<h2>Gedeelde DAG-planner</h2><p id="dagStatus" role="status" aria-live="polite">Verbinding controleren…</p><form id="dagLogin"><label>E-mailadres<input id="dagEmail" type="email" autocomplete="username" required></label><label>Wachtwoord<input id="dagPassword" type="password" autocomplete="current-password" required></label><button class="primary">Inloggen</button></form><div class="dag-sync-actions"><button id="dagInit" hidden>Gedeelde planner starten met huidige gegevens</button><button id="dagRetry" hidden>Opslaan opnieuw proberen</button><button id="dagReload" hidden>Gedeelde versie laden</button><button id="dagDraft" hidden>Lokale kopie downloaden</button><button id="dagLogout" hidden>Uitloggen</button></div><p class="small">Alleen bevoegde accounts delen deze planner. Een browserkopie is geen bevestiging van opslag in Supabase.</p>';
document.querySelector('header').after(panel);
const el=id=>document.getElementById(id);
const say=text=>{el('dagStatus').textContent=text;el('saveState').textContent=text;if(el('editDialog').open)el('updatedInfo').textContent=text;};
let client,user=null,allowed=false,revision=null,ready=false,busy=false,reading=false,dirty=false,conflict=false,invalid=false,lastSaved='',timer=null,authVersion=0;
const localAtStart=structuredClone(state);
const draftKey=()=> 'dag-shared-draft:xwbvlkkgydcdmgutmbqe:'+(user?.id||'local');
const formKey=()=>draftKey()+':form';
function normalise(x){if(Array.isArray(x))return x.map(normalise);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,normalise(x[k])]));return x;}
const canonical=x=>JSON.stringify(normalise(x));
function snapshot(){const p=structuredClone(state);delete p.collapsed;delete p.savedAt;delete p.exportedAt;return p;}
function remember(){try{localStorage.setItem(draftKey(),JSON.stringify({baseRevision:revision,payload:snapshot(),savedAt:new Date().toISOString()}));}catch{say('Lokale reservekopie niet beschikbaar. Sluit niet voordat Supabase het opslaan bevestigt.');}}
function readDraft(){try{return JSON.parse(localStorage.getItem(draftKey())||'null');}catch{return null;}}
function readForm(){try{return JSON.parse(localStorage.getItem(formKey())||'null');}catch{return null;}}
function clearDraft(){try{localStorage.removeItem(draftKey());localStorage.removeItem(formKey());}catch{}}
function gate(){document.documentElement.classList.toggle('dag-authenticated',!!user&&allowed&&ready&&!conflict);el('dagLogin').hidden=!!user;el('dagLogout').hidden=!user;el('dagReload').hidden=!allowed;el('dagDraft').hidden=!allowed;el('dagRetry').hidden=!allowed||!dirty||conflict;for(const field of el('editDialog').querySelectorAll('input,select,textarea,button[type=submit],#clearCell'))field.disabled=!ready||conflict;}
function queue(){if(!ready||!allowed||conflict||!user){say('Niet gedeeld opgeslagen. Log in en laad de gedeelde planner.');return;}if(canonical(snapshot())===lastSaved&&!busy&&!invalid){dirty=false;return;}dirty=true;remember();say(invalid?'Ongeldige activiteitinvoer: nog niet gedeeld opgeslagen.':'Wijzigingen wachten op opslaan…');gate();clearTimeout(timer);timer=setTimeout(flush,750);}
const saveBrowser=save;
save=function(){saveBrowser();queue();};
async function flush(){
 if(!ready||!allowed||!user||busy||conflict||invalid||!dirty)return;
 busy=true;const data=snapshot(),text=canonical(data),version=authVersion;say('Opslaan in Supabase…');
 try{
  const {data:next,error}=await client.rpc('dag_save',{expected_revision:revision,new_payload:data});if(error)throw error;if(version!==authVersion)return;
  const n=Number(next);if(!Number.isSafeInteger(n)||n<=revision)throw Error('Ongeldige opslagbevestiging.');
  revision=n;lastSaved=text;dirty=canonical(snapshot())!==text;
  if(!dirty&&!invalid){clearDraft();say('Gedeeld opgeslagen · '+new Date().toLocaleTimeString('nl-NL'));}else{remember();say(invalid?'Ongeldige activiteitinvoer is nog niet gedeeld opgeslagen.':'Nieuwere wijzigingen wachten op opslaan…');}
 }catch(error){
  if(version!==authVersion)return;dirty=true;remember();
  if(error.code==='40001'||String(error.message).includes('DAG_CONFLICT')){conflict=true;say('Een collega heeft een nieuwere versie opgeslagen. Download je lokale kopie en laad daarna de gedeelde versie. Er is niets overschreven.');}
  else say('Opslaan niet bevestigd: '+error.message+'. Download zo nodig je lokale kopie en probeer opnieuw.');
  return;
 }finally{busy=false;gate();}
 if(dirty&&!invalid)timer=setTimeout(flush,750);
}
function applyRemote(row){const view=state.collapsed;state=validateBackup(row.payload);ensureOrganisations();state.collapsed=view;revision=Number(row.revision);lastSaved=canonical(snapshot());dirty=false;invalid=false;conflict=false;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}fillOptions();render();}
async function loadRemote(force=false){
 if(!user||!allowed||reading||busy)return;reading=true;const version=authVersion;
 try{
  const {data:row,error}=await client.from('dag_documents').select('payload,revision,updated_at').eq('id','shared').single();if(error)throw error;if(version!==authVersion)return;
  if(!row.payload){revision=Number(row.revision);ready=false;el('dagInit').hidden=false;say('Nog geen gedeelde planner. De eerste bevoegde gebruiker kan de huidige browsergegevens bewust als startpunt publiceren.');gate();return;}
  el('dagInit').hidden=true;
  if(force){applyRemote(row);clearDraft();ready=true;gate();say('Gedeelde versie geladen · revisie '+revision);return;}
  if(revision===null){const draft=readDraft(),raw=readForm();applyRemote(row);ready=true;if((draft&&canonical(draft.payload)!==lastSaved)||raw){conflict=true;say('Een lokale werkversie is gevonden. Download die eerst en laad daarna bewust de gedeelde versie.');}else{clearDraft();say('Gedeelde planner geladen · revisie '+revision);}gate();return;}
  if(Number(row.revision)===revision)return;
  if(dirty||invalid||el('editDialog').open){if(dirty)remember();conflict=true;gate();say('Er is een nieuwere gedeelde versie. Download je lokale kopie en laad daarna de gedeelde versie.');return;}
  applyRemote(row);ready=true;gate();say('Bijgewerkt vanuit Supabase · revisie '+revision);
 }catch(error){say('Gedeelde planner niet geladen: '+error.message+'. Controleer de setup-SQL en accountrechten.');}
 finally{reading=false;}
}
async function activate(session){
 if(user&&session?.user?.id===user.id)return;
 authVersion++;allowed=false;user=session?.user||null;revision=null;ready=false;dirty=false;conflict=false;invalid=false;clearTimeout(timer);el('dagInit').hidden=true;gate();
 if(!user){say('Log in met een geautoriseerd account. Er wordt nog niets gedeeld opgeslagen.');return;}
 const version=authVersion;
 const {data:member,error}=await client.from('dag_access').select('user_id').eq('user_id',user.id).maybeSingle();if(version!==authVersion)return;
 if(error||!member){say('Dit account heeft geen toegang, of de setup-SQL is nog niet uitgevoerd. Laat de beheerder je UUID toevoegen aan dag_access.');return;}
 allowed=true;await loadRemote();gate();
}
el('dagLogin').onsubmit=async event=>{event.preventDefault();if(!client)return;say('Inloggen…');try{const {data,error}=await client.auth.signInWithPassword({email:el('dagEmail').value.trim(),password:el('dagPassword').value});if(error)throw error;await activate(data.session);}catch(error){say('Inloggen mislukt: '+error.message);}finally{el('dagPassword').value='';}};
el('dagInit').onclick=async()=>{if(!allowed||revision!==0||busy)return;if(!confirm('De huidige browsergegevens publiceren als gedeelde planner voor alle bevoegde gebruikers? Maak eerst een JSON-back-up.'))return;ready=true;conflict=false;el('dagInit').hidden=true;lastSaved='';gate();queue();await flush();};
el('dagRetry').onclick=flush;
el('dagReload').onclick=async()=>{if(busy){say('Wacht tot de lopende opslagpoging is afgerond.');return;}if((dirty||invalid||conflict)&&!confirm('De gedeelde versie laden en je lokale werkversie verlaten? Download eerst je lokale kopie.'))return;await loadRemote(true);};
el('dagDraft').onclick=()=>{if(!allowed)return;const draft=readDraft(),raw=readForm(),payload=draft?.payload||(!ready?localAtStart:snapshot());download('DAG-lokale-kopie-'+today()+'.json',JSON.stringify({...payload,unsavedActivityForm:raw,exportedAt:new Date().toISOString()},null,2),'application/json');};
el('dagLogout').onclick=async()=>{if(busy||dirty||invalid||conflict||readDraft()||readForm()){say('Download je lokale kopie en rond het opslaan af voordat je uitlogt.');return;}const {error}=await client.auth.signOut();if(error){say('Uitloggen mislukt: '+error.message);return;}try{localStorage.removeItem(KEY);}catch{}location.reload();};
function captureActivity(){
 if(!ready||conflict||!allowed||!user||!edit)return;
 const fields=[['Owner','owner'],['Start','start'],['Due','due'],['Done','done'],['Participants','participants'],['Title','title'],['Notes','notes'],['Link','link']];
 const values=Object.fromEntries(fields.map(([f,k])=>[k,el('edit'+f).value.trim()]));try{localStorage.setItem(formKey(),JSON.stringify({id:edit.id,bucket:edit.b,status:el('editStatus').value,values}));}catch{}
 const c={...blank(),...values,status:Number(el('editStatus').value)};
 invalid=!el('editForm').checkValidity()||!Number.isInteger(c.status)||c.status<0||c.status>4||['start','due','done'].some(k=>!validDate(c[k]))||!!(c.start&&c.due&&c.start>c.due)||!!(c.link&&!safeURL(c.link));
 if(invalid){say('Ongeldige of onvolledige invoer. De activiteit is nog niet gedeeld opgeslagen.');return;}
 if(c.participants!=='')c.participants=Number(c.participants);if(c.status===3&&!c.done)c.done=today();if(c.status!==3)c.done='';
 if(canonical({...c,updated:''})===canonical({...cell({id:edit.id},edit.b),updated:''})){if(dirty)queue();else if(!busy){try{localStorage.removeItem(formKey());}catch{}say('Geen nieuwe wijzigingen; gedeelde versie ongewijzigd.');}return;}
 c.updated=new Date().toISOString();state.cells[edit.id]??={};state.cells[edit.id][edit.b]=c;save();render();
}
for(const event of ['input','change','submit'])el('editForm').addEventListener(event,captureActivity);
for(const button of document.querySelectorAll('#editDialog [data-close="editDialog"]'))if(button.textContent.trim()==='Annuleren')button.textContent='Sluiten';
const note=document.createElement('p');note.className='small';note.textContent='Wijzigingen worden automatisch opgeslagen na een korte pauze. Sluiten draait reeds opgeslagen wijzigingen niet terug.';el('editForm').querySelector('.dialogbody').prepend(note);
el('saveOfflineHTML').hidden=true;
window.addEventListener('beforeunload',event=>{if(dirty||busy||invalid){event.preventDefault();event.returnValue='';}});
window.addEventListener('online',()=>{if(dirty&&!conflict)flush();else loadRemote();});
setInterval(()=>{if(user&&!document.hidden)loadRemote();},10000);gate();
if(!window.supabase){say('Supabase-bibliotheek niet geladen. Herlaad met internetverbinding; gedeeld opslaan is niet actief.');return;}
client=window.supabase.createClient(PROJECT_URL,PUBLIC_KEY);
client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN')setTimeout(()=>activate(session),0);});
const {data,error}=await client.auth.getSession();if(error){say('Sessie niet geladen: '+error.message);return;}await activate(data.session);
})();
