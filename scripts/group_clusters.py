"""Add thematic/supporting section headings to the published planner matrix."""
from pathlib import Path

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</body>") != 1 or "function renderPlanner(ps)" not in html:
    raise ValueError("Planner template changed; cannot safely add cluster sections")
addition = r"""
<style>
#plannerTable tbody tr.cluster-category>td{position:static!important;width:auto!important;max-width:none!important;background:#fafafa;border-top:1px solid #dedee2;border-bottom:1px solid #e5e5e8;padding:18px 14px 13px}
.cluster-category-label{position:sticky;left:14px;display:inline-block}
.cluster-category-label h3{font-size:14px;font-weight:700;letter-spacing:-.2px;margin:0 0 3px;color:#36393e}
.cluster-category-label h3:before{content:'';display:inline-block;width:6px;height:6px;background:var(--orange);border-radius:50%;margin-right:9px;vertical-align:middle}
.cluster-category-label .small{font-size:11px;color:var(--muted)}
@media print{.cluster-category-label{position:static}#plannerTable tbody tr.cluster-category>td{padding:9px 4px!important}}
</style>
<script>
'use strict';
const DAG_SUPPORTING_CLUSTERS=new Set(['Advies, Beleid & Kwaliteit','Business Support & IT','Vastgoed & Facilitair']);
function groupPlannerRows(ps){
 const body=document.getElementById('plannerTable').querySelector('tbody');
 const groups=[[],[]];
 let current=null;
 for(const row of Array.from(body.children)){
  const toggle=row.querySelector('[data-toggle]');
  if(toggle){const cluster=CLUSTERS[Number(toggle.dataset.toggle)];current=DAG_SUPPORTING_CLUSTERS.has(cluster)?1:0;}
  if(current!==null)groups[current].push(row);
 }
 body.replaceChildren();
 const titles=['Thematische clusters','Ondersteunende clusters'];
 groups.forEach((rows,index)=>{
  if(!rows.length)return;
  const selected=ps.filter(p=>Number(DAG_SUPPORTING_CLUSTERS.has(p.cluster))===index);
  if(!selected.length)return;
  const clusterCount=new Set(selected.map(p=>p.cluster)).size;
  const header=document.createElement('tr');header.className='cluster-category';
  header.innerHTML='<td colspan="'+(state.buckets.length+1)+'"><div class="cluster-category-label"><h3>'+titles[index]+'</h3><div class="small">'+clusterCount+' clusters · '+selected.length+' '+(index===0?'opleidingsrecords':'organisatieonderdelen')+' in deze selectie</div></div></td>';
  body.append(header,...rows);
 });
}
const renderPlannerBeforeSections=renderPlanner;
renderPlanner=function(ps){renderPlannerBeforeSections(ps);groupPlannerRows(ps);};
render();
</script>
"""
html = html.replace("</body>", addition + "</body>", 1)
path.write_text(html, encoding="utf-8")
print("Added thematic and supporting cluster sections")
