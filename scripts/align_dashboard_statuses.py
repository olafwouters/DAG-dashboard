from pathlib import Path
import re

root = Path('_site')
labels = "labels=['Hulpvraag','Afstemming','Uitvoering','Follow-up','Afgesloten']"
colors = "colors=['#e5ebe8','#aabbb8','#ee7f00','#8296aa','#285f63']"

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Dashboard source marker changed: ' + old)
    return text.replace(old, new, 1)

for name in ['reporting-profiles.js', 'reporting-buckets.js', 'reporting-charts.js', 'reporting-dashboard.js']:
    p = root / name
    text = p.read_text(encoding='utf-8')
    text, n = re.subn(r"labels=\[[^\]]+\]", labels, text, count=1)
    if n != 1:
        raise ValueError('Missing labels: ' + name)
    text, n = re.subn(r"colors=\[[^\]]+\]", colors, text, count=1)
    if n != 1:
        raise ValueError('Missing colors: ' + name)
    text = replace_once(text, 'order=[3,2,1,0]', 'order=[4,3,2,1,0]')
    text = text.replace('zero=()=>[0,0,0,0]', 'zero=()=>[0,0,0,0,0]')
    if name in ['reporting-profiles.js', 'reporting-buckets.js']:
        old = 'if(!c||!Number.isInteger(c.status)||c.status<0||c.status>4)'
        new = "const column=g.DAGStatusColumns.getActivityColumn(c),status=column?['request','agreement','delivery','followup','closed'].indexOf(column.id):-2;if(!column)"
        text = replace_once(text, old, new)
        text = replace_once(text, 'if(c.status===4)', 'if(status===-1)')
        text = text.replace('[c.status]', '[status]')
    text = re.sub(r'(counts(?:\?\.)?)\[3\]', r'\1[4]', text)
    text = text.replace('v[3]', 'v[4]')
    for old, new in [
        ('Afgerond in deze bucket', 'Afgesloten'),
        ('afgeronde bucketactiviteiten', 'afgesloten activiteiten'),
        ('Afgeronde bucketactiviteiten', 'Afgesloten activiteiten'),
        ('afgerond in buckets', 'afgesloten activiteiten'),
        ('activiteiten afgerond', 'activiteiten afgesloten'),
        ('afgeronde activiteiten', 'afgesloten activiteiten'),
        ('Afgeronde uitvoering', 'Afgesloten activiteiten'),
        ('Afgerond', 'Afgesloten'),
        ('afgerond', 'afgesloten'),
        ('Nog niet gestart: lichtgrijs', 'Hulpvraag: lichtgrijs'),
        ('Gepland: grijs', 'Afstemming: grijs'),
        ('In uitvoering: oranje', 'Uitvoering: oranje'),
        ('activiteiten nog niet gestart of gepland', 'activiteiten in Hulpvraag of Afstemming')
    ]:
        text = text.replace(old, new)
    if name == 'reporting-dashboard.js':
        text = text.replace('slice(k*8,k*8+8)', 'slice(k*8,k*8+8)')
        text = replace_once(text, 'y+72+n*16', 'y+65+n*16')
        text = replace_once(text, 'y+78+n*16,labels[st]', 'y+71+n*16,labels[st]')
        text = replace_once(text, 'y+78+n*16,w.counts[st]', 'y+71+n*16,w.counts[st]')
        text = text.replace("'Nog niet afgesloten'", "'Open activiteit'")
        text = text.replace('25*Math.cos(t)', '30*Math.cos(t)').replace('25*Math.sin(t)', '30*Math.sin(t)')
        text = text.replace('18*Math.cos(t)', '21*Math.cos(t)').replace('18*Math.sin(t)', '21*Math.sin(t)')
        text = text.replace('218+j*17', '210+j*17').replace('224+j*17', '216+j*17')
        text = text.replace('Een afgesloten bucket sluit geen traject af.', 'Een afgesloten activiteit sluit geen traject af. Follow-up is afzonderlijk zichtbaar.')
    p.write_text(text, encoding='utf-8')

extra = r'''
(function(g){
'use strict';
const columns=['request','agreement','delivery','followup','closed'],labels=columns.map(id=>Object.values(g.DAGStatusColumns.columns).find(c=>c.id===id).label),colors=['#e5ebe8','#aabbb8','#ee7f00','#8296aa','#285f63'];
function summary(a){return '<section class="rp-panel" aria-label="Activiteiten per status"><h3>Dezelfde activiteitstatus als Planner en Status</h3><div class="ds-statuses">'+labels.map((label,i)=>'<div><i style="background:'+colors[i]+'"></i><span>'+label+'</span><strong>'+a.counts[i]+'</strong></div>').join('')+'<div><span>Niet van toepassing</span><strong>'+a.na+'</strong></div></div><p>'+a.total+' toepasselijke activiteiten · '+a.programmes+' unieke onderdelen met toepasselijke activiteiten. Follow-up is nog niet afgesloten; trajectafsluiting blijft een afzonderlijke registratie.</p></section>';}
for(const api of [g.DAGBucketReporting,g.DAGReportProfiles]){const original=api.render;api.render=function(a,profile,scope){return summary(a)+original(a,profile,scope);};}
const originalModels=g.DAGReportingCharts.models;
g.DAGReportingCharts.models=function(a,profile){if(profile!=='extern')return originalModels(a,profile);return [{title:'Status van unieke activiteiten',values:a.counts.slice(),labels:labels.slice(),colors:colors.slice(),center:a.total,caption:'activiteiten'}];};
const style=document.createElement('style');style.textContent='#dashboard .bp-cards,#dashboard .rp-streams{grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:22px}#dashboard .bp-card{padding:24px}#dashboard .rc-layout{grid-template-columns:minmax(150px,190px) minmax(0,1fr);gap:18px}#dashboard .rc-ring svg{width:100%;max-width:190px}#dashboard .rc-legend{font-size:12px}#dashboard .rc-legend li{margin:13px 0}#dashboard .ds-statuses{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:14px}#dashboard .ds-statuses>div{padding:14px;background:#f3f6f4;border-radius:10px}#dashboard .ds-statuses i{display:inline-block;width:9px;height:9px;margin-right:7px}#dashboard .ds-statuses strong{display:block;font-size:28px;margin-top:8px}@media(max-width:500px){#dashboard .rc-layout{grid-template-columns:1fr}#dashboard .rc-ring{max-width:190px;margin:auto}#dashboard .bp-card{padding:18px}}';document.head.append(style);
})(globalThis);
'''
p = root / 'reporting-dashboard.js'
text = p.read_text(encoding='utf-8')
marker = 'renderDashboard=function(){draw()};'
text = replace_once(text, marker, extra + '\n' + marker)
p.write_text(text, encoding='utf-8')
for name in ['reporting-profiles.js', 'reporting-buckets.js', 'reporting-dashboard.js']:
    text = (root / name).read_text(encoding='utf-8')
    assert "order=[4,3,2,1,0]" in text
    assert "labels=['Hulpvraag','Afstemming','Uitvoering','Follow-up','Afgesloten']" in text
