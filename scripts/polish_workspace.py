"""Compact the shared UI; use Supabase as the only automatic workspace source."""
from pathlib import Path
import re
import shutil

page = Path("_site/index.html")
html = page.read_text(encoding="utf-8")
sync_path = Path("_site/shared-planner.js")
sync = sync_path.read_text(encoding="utf-8")


def replace_sync(old, new):
    global sync
    if sync.count(old) != 1:
        raise ValueError("Shared planner changed; cannot safely patch: " + old)
    sync = sync.replace(old, new, 1)


pattern = r"try\{const saved=localStorage.getItem\(KEY\);if\(saved\)state=validateBackup\(JSON.parse\(saved\)\);\}catch\(e\)\{storageOK=false;\$\('saveState'\).textContent='[^']*';\}"
html, count = re.subn(pattern, "// Workspace state is loaded only from Supabase after sign-in.", html)
if count != 1:
    raise ValueError("Expected one browser-state bootstrap")
if html.count("const KEY='hanze-dag-projectplanner-v1';") != 1:
    raise ValueError("Unexpected cache key")
html = html.replace("const KEY='hanze-dag-projectplanner-v1';", "const KEY='hanze-dag-shared-cache-v2';", 1)
replace_sync("const draftKey=()=> 'dag-shared-draft:xwbvlkkgydcdmgutmbqe:'+(user?.id||'local');", "const draftRoot=()=> 'dag-shared-draft:xwbvlkkgydcdmgutmbqe:'+(user?.id||'local');\nconst tabId=globalThis.crypto?.randomUUID?.()||(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));\nconst draftKey=()=>draftRoot()+':session:'+tabId;")
old = "if(revision===null){const draft=readDraft(),raw=readForm();applyRemote(row);ready=true;if((draft&&canonical(draft.payload)!==lastSaved)||raw){conflict=true;say('Een lokale werkversie is gevonden. Download die eerst en laad daarna bewust de gedeelde versie.');}else{clearDraft();say('Gedeelde planner geladen · revisie '+revision);}gate();return;}"
new = "if(revision===null){applyRemote(row);ready=true;gate();say('Gedeelde planner geladen · revisie '+revision);return;}"
replace_sync(old, new)
helper = r"""function ensureBundledProgrammes(){
 const list=JSON.parse(document.getElementById('embeddedCatalogue').textContent).programs;
 if(!Array.isArray(list)||list.length!==139||new Set(list.map(p=>p.id)).size!==139)throw Error('De ingebouwde opleidingslijst is niet geldig.');
 const ids=new Set(state.programs.map(p=>p.id));for(const p of list)if(!ids.has(p.id))state.programs.push(validateProgram(p));
}
"""
replace_sync("function applyRemote(row){", helper + "function applyRemote(row){")
replace_sync("state=validateBackup(row.payload);ensureOrganisations();", "state=validateBackup(row.payload);ensureBundledProgrammes();ensureOrganisations();")
old = "el('dagDraft').onclick=()=>{if(!allowed)return;const draft=readDraft(),raw=readForm(),payload=draft?.payload||(!ready?localAtStart:snapshot());download('DAG-lokale-kopie-'+today()+'.json',JSON.stringify({...payload,unsavedActivityForm:raw,exportedAt:new Date().toISOString()},null,2),'application/json');};"
new = r"""el('dagDraft').onclick=()=>{
 if(!allowed)return;const copies=[];
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key==='hanze-dag-projectplanner-v1'||key===draftRoot()||key.startsWith(draftRoot()+':')){try{copies.push({key,data:JSON.parse(localStorage.getItem(key))});}catch{}}}}catch{}
 download('DAG-herstelkopieen-'+today()+'.json',JSON.stringify({format:'dag-recovery-bundle-v1',sharedSnapshot:ready?snapshot():null,recoveryCopies:copies,exportedAt:new Date().toISOString()},null,2),'application/json');
};"""
replace_sync(old, new)
css = Path("web/workspace-polish.css").read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected HTML structure")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
html = html.replace("</body>", '<script src="./workspace-polish.js"></script></body>', 1)
shutil.copyfile("web/workspace-polish.js", "_site/workspace-polish.js")
page.write_text(html, encoding="utf-8")
sync_path.write_text(sync, encoding="utf-8")
print("Applied shared-first loading, compact header and shared bucket colours; catalogue retained")
