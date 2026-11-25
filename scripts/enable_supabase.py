"""Enable authenticated Supabase saving on the already-built Pages application."""
from pathlib import Path

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected planner template")
style = """<style>
html:not(.dag-authenticated) main,html:not(.dag-authenticated) .header-actions{display:none!important}
.dag-sync-panel{margin:18px 30px;padding:18px 22px;background:#fff;border:1px solid #e5e5e8;border-radius:18px}
.dag-sync-panel h2{margin:0 0 8px}.dag-sync-panel form,.dag-sync-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.dag-sync-panel label input{display:block}.dag-sync-actions{margin-top:12px}.dag-sync-panel [hidden]{display:none!important}
@media print{.dag-sync-panel{display:none!important}}
</style>"""
html = html.replace("</head>", style + "</head>", 1)
html = html.replace("Huidige werkruimte vervangen door deze back-up", "Gedeelde werkruimte voor alle gebruikers vervangen door deze back-up")
html = html.replace("Alle plannerinvoer en eigen catalogusrecords verwijderen?", "Alle gedeelde plannerinvoer voor alle gebruikers en eigen catalogusrecords verwijderen?")
html = html.replace("Activiteit opgeslagen; dashboard bijgewerkt.", "Activiteit lokaal bijgewerkt; gedeelde opslag wordt gecontroleerd.")
html = html.replace("</body>", '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="./follow-up-editor.js"></script><script src="./shared-planner.js"></script></body>', 1)
shared=Path('web/shared-planner.js').read_text(encoding='utf-8')
old="const c={...blank(),...values,status:Number(el('editStatus').value)};"
new="const c={...cell({id:edit.id},edit.b),...blank(),...values,status:Number(el('editStatus').value)};c.followUpDone=DAGFollowUpEditor.read(c.status);"
if shared.count(old)!=1:raise ValueError('Unexpected shared activity capture handler')
shared=shared.replace(old,new,1)
old="status:el('editStatus').value,values}"
new="status:el('editStatus').value,followUpDone:DAGFollowUpEditor.read(Number(el('editStatus').value)),values}"
if shared.count(old)!=1:raise ValueError('Unexpected activity draft handler')
shared=shared.replace(old,new,1)
Path('_site/shared-planner.js').write_text(shared,encoding='utf-8')
Path('_site/follow-up-editor.js').write_text(Path('web/follow-up-editor.js').read_text(encoding='utf-8'),encoding='utf-8')
path.write_text(html, encoding="utf-8")
print("Enabled Supabase sign-in and shared saving; activity extensions and follow-up are preserved")

# Load the shared labels before the template's first render; only patch Planner cells.
start=html.index('function renderPlanner(')
end=html.index('\nfunction ',start+1)
planner=html[start:end]
if planner.count('STATUS[c.status]')!=2:raise ValueError('Unexpected Planner cell labels')
planner=planner.replace('STATUS[c.status]', 'DAGPlannerLabels.label(state.cells[p.id]?.[b])')
html=html[:start]+planner+html[end:]
html=html.replace('</head>', '<script src="./status-columns.js"></script><script src="./planner-labels.js"></script></head>',1)
html=html.replace('<script src="./follow-up-editor.js">', '<script>DAGPlannerLabels.install();</script><script src="./follow-up-editor.js">',1)
for name in ['status-columns.js','planner-labels.js']:
    Path('_site/'+name).write_text(Path('web/'+name).read_text(encoding='utf-8'),encoding='utf-8')
path.write_text(html,encoding='utf-8')
