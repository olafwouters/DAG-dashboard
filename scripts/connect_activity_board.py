"""Connect the built Status board to activity containers; retain trajectory dialogs."""
from pathlib import Path
page=Path('_site/index.html')
html=page.read_text(encoding='utf-8')
path=Path('_site/status-board.js')
board=path.read_text(encoding='utf-8')
start=board.index('function renderStatusBoard(ps){')
end=board.index('function setBoardStatus(',start)
board=board[:start]+"function renderStatusBoard(ps){if(globalThis.DAGActivityBoard)DAGActivityBoard.render(ps); }\n"+board[end:]
old_filters="for(const id of ['search','ownerFilter'])$(id).addEventListener('input',render);for(const id of ['clusterFilter','levelFilter','formFilter','typeFilter'])$(id).onchange=render;"
new_filters="for(const id of ['search','ownerFilter'])$(id).addEventListener('input',()=>render());for(const id of ['clusterFilter','levelFilter','formFilter','typeFilter'])$(id).onchange=()=>render();"
if html.count(old_filters)!=1:
    raise ValueError('Expected exactly one shared filter binding block')
html=html.replace(old_filters,new_filters,1)
marker='<script src="./shared-planner.js"></script>'
if html.count(marker)!=1:raise ValueError('Unexpected shared planner script')
html=html.replace(marker,'<script src="./status-containers.js"></script><script src="./activity-board.js"></script>'+marker,1)
# Only a successfully validated activity save restores this programme.
assignment='state.cells[edit.id][edit.b]=c;save();render();'
if html.count(assignment)!=1:raise ValueError('Unexpected Planner activity save block')
html=html.replace(assignment,'state.cells[edit.id][edit.b]=c;delete state.hiddenProgrammeTrajectories?.[edit.id];save();render();',1)
shared_path=Path('_site/shared-planner.js')
shared=shared_path.read_text(encoding='utf-8')
equality="if(canonical({...c,updated:''})===canonical({...cell({id:edit.id},edit.b),updated:''})){"
if shared.count(equality)!=1:raise ValueError('Unexpected automatic-save equality guard')
shared=shared.replace(equality,"if(!state.hiddenProgrammeTrajectories?.[edit.id]&&canonical({...c,updated:''})===canonical({...cell({id:edit.id},edit.b),updated:''})){",1)
if shared.count(assignment)!=1:raise ValueError('Unexpected automatic activity save block')
shared=shared.replace(assignment,'state.cells[edit.id][edit.b]=c;delete state.hiddenProgrammeTrajectories?.[edit.id];save();render();',1)
for name in ['status-containers.js','activity-board.js']:
    Path('_site/'+name).write_text(Path('web/'+name).read_text(encoding='utf-8'),encoding='utf-8')
shared_path.write_text(shared,encoding='utf-8')
path.write_text(board,encoding='utf-8')
page.write_text(html,encoding='utf-8')
