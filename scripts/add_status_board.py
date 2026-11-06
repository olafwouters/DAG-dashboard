"""Build linked trajectory controls without changing the activity storage model."""
from pathlib import Path
import shutil

def once(text,old,new):
    if text.count(old)!=1:raise ValueError('Unexpected source marker: '+old)
    return text.replace(old,new,1)

path=Path('_site/index.html')
html=path.read_text(encoding='utf-8')
html=once(html,"e.preventDefault();const c=blank();c.status=+$('editStatus').value;","e.preventDefault();const c={...cell({id:edit.id},edit.b),...blank()};c.status=+$('editStatus').value;")
board=Path('web/status-board.js').read_text(encoding='utf-8')
patches=[
("closure:'',applied:","closure:'',closureNote:'',applied:"),
('<article class="board-card">','<article class="board-card" draggable="true" data-trajectory-id="${esc(p.id)}"><span class="trajectory-grip" aria-hidden="true">⠿ Versleep traject</span>'),
('<section class="board-lane"><div class="board-lane-head">','<section class="board-lane" data-trajectory-phase="${i}"><div class="board-lane-head">'),
("const input=k=>`","const input=k=>k==='owner'?DAGTrajectoryUI.ownerField(m.owner):k==='action'?DAGTrajectoryUI.actionField(m.action,m.phase):`"),
("['waitReason','reviewDate','action','actionOwner','actionDue']","['waitReason','reviewDate','action','actionDue']"),
("if(!m.actionOwner||!m.actionDue)w.push('Eigenaar of datum vervolgactie ontbreekt')","if(!m.owner||!m.actionDue)w.push('Trajecteigenaar of datum vervolgactie ontbreekt')"),
("${m.actionOwner||'Geen eigenaar'}","${m.owner||'Geen eigenaar'}"),
('<label>Afsluitreden (bij Afgesloten)','<div class="trajectory-close-row"><label>Afsluitreden'),
("m.closure)}</select></label>${['applied'","m.closure)}</select></label><label>Reden<textarea name=\"closureNote\">${esc(m.closureNote||'')}</textarea></label></div>${['applied'"),
('<button class="primary">Trajectvelden opslaan</button></form>','<button class="primary">Trajectvelden opslaan</button><button type="submit" name="closeTrajectory" value="1">Traject afsluiten</button></form><button type="button" data-trajectory-delete>Traject verwijderen</button>'),
("const v=Object.fromEntries(new FormData(e.target));if(v.phase==='4'&&!v.closure)","const v=Object.fromEntries(new FormData(e.target));DAGTrajectoryUI.resolveAction(v);if(e.submitter?.name==='closeTrajectory')v.phase='4';if(v.phase==='4'&&(!v.closure||!String(v.closureNote||'').trim()))"),
("toast('Kies een afsluitreden.')","toast('Kies een afsluitreden en vul de reden in.')"),
("return (as.length||state.programmeTrajectories?.[p.id]||$('boardEmpty').checked)","return !state.hiddenProgrammeTrajectories?.[p.id]&&(as.length||state.programmeTrajectories?.[p.id]||$('boardEmpty').checked)"),
("dialog.addEventListener('click',e=>{if(e.target.closest('[data-programme-close]'))close();","dialog.addEventListener('click',e=>{if(e.target.closest('[data-trajectory-delete]')){if(baseline!==JSON.stringify(meta(current))){toast('Trajectvelden zijn intussen gewijzigd. Open de nieuwste versie.');return;}if(DAGTrajectoryUI.remove(current)){dirty=false;current=null;dialog.close();}return;}if(e.target.closest('[data-programme-close]'))close();")]
for old,new in patches:board=once(board,old,new)
starter=Path('web/start-trajectory.js').read_text(encoding='utf-8')
for old,new in [
('<label>Trajecteigenaar<input name="owner" required></label>',"${DAGTrajectoryUI.ownerField('',true)}"),
('<label>Volgende actie<input name="action" required></label>',"${DAGTrajectoryUI.actionField('','0',true)}"),
('<label>Actie-eigenaar (leeg = trajecteigenaar)<input name="actionOwner"></label>',''),
('const plan=prepare(state,v,blank);','DAGTrajectoryUI.resolveAction(v);const plan=prepare(state,v,blank);delete state.hiddenProgrammeTrajectories?.[plan.programmeId];')]:starter=once(starter,old,new)
html=once(html,'</head>','<style>'+Path('web/status-board.css').read_text(encoding='utf-8')+'</style></head>')
html=once(html,'</body>','<script src="./trajectory-controls.js"></script><script src="./status-board.js"></script><script src="./start-trajectory.js"></script></body>')
Path('_site/status-board.js').write_text(board,encoding='utf-8')
Path('_site/start-trajectory.js').write_text(starter,encoding='utf-8')
shutil.copyfile('web/trajectory-controls.js','_site/trajectory-controls.js')
path.write_text(html,encoding='utf-8')
