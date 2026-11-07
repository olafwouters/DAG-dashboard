"""Install dynamic bucket charts grouped by sub-project; keep optional grouped workstream reports."""
from pathlib import Path
import shutil

def once(text,old,new):
    if text.count(old)!=1:raise ValueError('Reporting source marker changed: '+old)
    return text.replace(old,new,1)
def span(text,start,end,replacement):
    if text.count(start)!=1 or text.count(end)!=1:raise ValueError('Reporting source markers changed')
    a=text.index(start);b=text.index(end,a)
    return text[:a]+replacement+text[b:]

p=Path('_site/index.html');html=p.read_text(encoding='utf-8')
if html.count('</body>')!=1 or 'id="dashboard"' not in html:raise ValueError('Unexpected dashboard template')
source=Path('web/reporting-dashboard.js').read_text(encoding='utf-8')
source=span(source,'function aggregate(','function donut(',"function aggregate(s,scope='programme',cluster=''){return DAGReportProfiles.aggregate(s,scope,cluster);}\n")
source=once(source,"let profile='organisatie',scope='programme',cluster='';","let profile='organisatie',scope='programme',cluster='',chartMode='buckets';")
source=once(source,'<button type="button" class="primary" id="reportDownload">','<label>Grafieken<select id="reportCharts"><option value="buckets">Per bucket en deelproject (automatisch)</option><option value="groups">Werkstroomgroepen (optioneel)</option></select></label><button type="button" class="primary" id="reportDownload">')
draw=r"""function draw(){const available=[...new Set(state.programs.filter(p=>(p.type==='organisation'?'organisation':'programme')===scope).map(p=>p.cluster))].sort((a,b)=>a.localeCompare(b,'nl'));if(!available.includes(cluster))cluster='';el('reportCluster').innerHTML='<option value="">Alle clusters</option>'+available.map(n=>'<option value="'+E(n)+'" '+(n===cluster?'selected':'')+'>'+E(n)+'</option>').join('');const body=el('reportBody');if(chartMode==='buckets'){body.innerHTML=DAGBucketReporting.render(DAGBucketReporting.aggregate(state,scope,cluster),profile,scope);}else{const data=aggregate(state,scope,cluster);body.innerHTML=DAGReportProfiles.render(data,profile,scope);DAGReportingCharts.mount(body,data,profile,scope);}}
"""
source=span(source,'function draw(){',"el('reportProfile').onchange=",draw)
source=once(source,"el('reportProfile').onchange=","el('reportCharts').onchange=e=>{chartMode=e.target.value;draw()};el('reportProfile').onchange=")
source=once(source,"link.download='DAG-'+profile+'-'","link.download='DAG-'+profile+'-'+chartMode+'-'")
source=once(source,'const a=aggregate(state,scope,cluster),bytes=pdfBytes(a,profile,scope,cluster)',"const a=chartMode==='buckets'?DAGBucketReporting.aggregate(state,scope,cluster):aggregate(state,scope,cluster),bytes=pdfBytes(a,profile,scope,cluster)")
start=" header(profile==='bestuur'?";end='\n const objects=['
a=source.index(start);b=source.index(end,a);old_pages=source[a:b]
bucket_pages=r""" if(a.bucketCharts){
 let wrote=false;
 for(const grp of a.groups){if(!grp.work.length)continue;const chunks=Math.ceil(grp.work.length/8);for(let k=0;k<chunks;k++){
  header(grp.name+(k?' (vervolg)':''));text(28,123,grp.work.length+' buckets | '+grp.total+' activiteiten | '+grp.counts[3]+' afgerond in buckets | Trajecten expliciet uitgevoerd: '+a.completed,9,true);
  grp.work.slice(k*8,k*8+8).forEach((w,j)=>{const x=28+(j%4)*200,y=140+Math.floor(j/4)*190;box(x,y,185,174,'#f3f6f4');const title=String(w.name).replace(/\s+/g,' ').match(/.{1,22}/g)||[''];title.forEach((line,n)=>text(x+10,y+15+n*8,line,7.5,true));pie(x+39,y+105,w.counts);order.forEach((st,n)=>{box(x+78,y+72+n*16,5,5,colors[st]);text(x+88,y+78+n*16,labels[st],7);text(x+165,y+78+n*16,w.counts[st],8,true);});text(x+10,y+161,'N.v.t. '+w.na+' | Geen registratie '+w.absent,7,false,muted);});
  finish();wrote=true;}}
 if(!wrote){header('Activiteiten per Planner-bucket');text(28,178,'Nog geen Planner-buckets beschikbaar.',11);finish();}
 for(let k=0;k<a.rows.length;k+=16){header('Bucketactiviteiten per cluster');text(28,123,'Afgerond betekent hier: de bucketactiviteit, niet het gehele traject.',9,true);clusterRows(a.rows.slice(k,k+16),160);finish();}
 }else{
"""
source=source[:a]+bucket_pages+old_pages+'\n }'+source[b:]
old="'Alleen geregistreerde activiteiten in vier werkstromen; leeg en n.v.t. tellen niet mee. Uitvoering is geen effectmeting.'"
new="(a.bucketCharts?'Een afgeronde bucket sluit geen traject af. Trajectuitkomsten komen alleen uit expliciete afsluiting in Status.':'Unieke totalen; een activiteit kan in meerdere grafieken staan. Leeg en n.v.t. tellen niet mee; uitvoering is geen effectmeting.')"
source=once(source,old,new)
html=once(html,'</body>','<script src="./reporting-profiles.js"></script><script src="./reporting-charts.js"></script><script src="./reporting-buckets.js"></script><script src="./reporting-dashboard.js"></script></body>')
Path('_site/reporting-dashboard.js').write_text(source,encoding='utf-8')
for name in ['reporting-profiles.js','reporting-charts.js','reporting-buckets.js']:shutil.copyfile('web/'+name,'_site/'+name)
p.write_text(html,encoding='utf-8')
