"""Install shared report mappings and audience-specific dashboard layouts."""
from pathlib import Path
import shutil

def span(text,start,end,replacement):
    if text.count(start)!=1 or text.count(end)!=1:raise ValueError('Reporting source markers changed')
    a=text.index(start);b=text.index(end,a)
    return text[:a]+replacement+text[b:]

p=Path('_site/index.html');html=p.read_text(encoding='utf-8')
if html.count('</body>')!=1 or 'id="dashboard"' not in html:raise ValueError('Unexpected dashboard template')
source=Path('web/reporting-dashboard.js').read_text(encoding='utf-8')
source=span(source,'function aggregate(','function donut(',"function aggregate(s,scope='programme',cluster=''){return DAGReportProfiles.aggregate(s,scope,cluster);}\n")
draw=r"""function draw(){const available=[...new Set(state.programs.filter(p=>(p.type==='organisation'?'organisation':'programme')===scope).map(p=>p.cluster))].sort((a,b)=>a.localeCompare(b,'nl'));if(!available.includes(cluster))cluster='';el('reportCluster').innerHTML='<option value="">Alle clusters</option>'+available.map(n=>'<option value="'+E(n)+'" '+(n===cluster?'selected':'')+'>'+E(n)+'</option>').join('');el('reportBody').innerHTML=DAGReportProfiles.render(aggregate(state,scope,cluster),profile,scope);}
"""
source=span(source,'function draw(){',"el('reportProfile').onchange=",draw)
old='Alleen geregistreerde activiteiten in vier werkstromen; leeg en n.v.t. tellen niet mee. Uitvoering is geen effectmeting.'
new='Unieke totalen; een activiteit kan in meerdere grafieken staan. Leeg en n.v.t. tellen niet mee; uitvoering is geen effectmeting.'
if source.count(old)!=1:raise ValueError('Reporting footer changed')
source=source.replace(old,new,1)
html=html.replace('</body>','<script src="./reporting-profiles.js"></script><script src="./reporting-dashboard.js"></script></body>',1)
Path('_site/reporting-dashboard.js').write_text(source,encoding='utf-8')
shutil.copyfile('web/reporting-profiles.js','_site/reporting-profiles.js')
p.write_text(html,encoding='utf-8')
