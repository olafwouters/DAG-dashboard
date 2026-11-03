"""Apply planner UI preferences to the generated GitHub Pages entry point."""
from pathlib import Path

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")


def replace_once(old, new):
    global html
    if html.count(old) != 1:
        raise ValueError("Planner template changed; cannot safely replace: " + old)
    html = html.replace(old, new, 1)


replace_once('collapsed=!!state.collapsed[cl]', 'collapsed=state.collapsed[cl]!==false')
replace_once('state.collapsed[cl]=!state.collapsed[cl]', 'state.collapsed[cl]=state.collapsed[cl]===false')
replace_once("$('expandAll').onclick=()=>{state.collapsed={};", "$('expandAll').onclick=()=>{state.collapsed=Object.fromEntries(CLUSTERS.map(cl=>[cl,false]));")
replace_once('<input id="editOwner" maxlength="150" placeholder="Naam of team">', '<select id="editOwner" aria-label="Eigenaar"></select>')
replace_once('<input id="ownerFilter" placeholder="Naam…">', '<select id="ownerFilter" aria-label="Filter op eigenaar"></select>')
replace_once("const c=cell(p,b);$('editName').textContent", "const c=cell(p,b);fillOwnerMenu('editOwner','Geen eigenaar',c.owner);$('editName').textContent")

preferences = r"""
<script>
'use strict';
const DAG_OWNERS=['Annalies','Henriëtte','Olaf','Vincent'];
function fillOwnerMenu(id,emptyLabel,current){
 const select=document.getElementById(id);
 const previous=current===undefined?select.value:String(current||'');
 const legacy=new Set();
 for(const cells of Object.values(state.cells))for(const c of Object.values(cells))if(c.owner)legacy.add(String(c.owner));
 if(previous)legacy.add(previous);
 const names=[...DAG_OWNERS,...[...legacy].filter(n=>!DAG_OWNERS.includes(n)).sort((a,b)=>a.localeCompare(b,'nl'))];
 select.innerHTML='<option value="">'+esc(emptyLabel)+'</option>'+names.map(name=>'<option value="'+esc(name)+'">'+esc(name)+(DAG_OWNERS.includes(name)?'':' (bestaand)')+'</option>').join('');
 select.value=previous;
}
const renderBeforeOwnerMenus=render;
render=function(){fillOwnerMenu('ownerFilter','Alle eigenaren');renderBeforeOwnerMenus();};
fillOwnerMenu('editOwner','Geen eigenaar');
document.getElementById('ownerFilter').onchange=render;
// Start each page visit collapsed; leave all saved activity data untouched.
state.collapsed={};
render();
</script>
"""
replace_once('</body>', preferences + '</body>')
path.write_text(html, encoding="utf-8")
print("Applied collapsed clusters and owner dropdowns")
