"""Connect the built Status board to activity containers; retain trajectory dialogs."""
from pathlib import Path
page=Path('_site/index.html')
html=page.read_text(encoding='utf-8')
path=Path('_site/status-board.js')
board=path.read_text(encoding='utf-8')
start=board.index('function renderStatusBoard(ps){')
end=board.index('function setBoardStatus(',start)
board=board[:start]+"function renderStatusBoard(ps){if(globalThis.DAGActivityBoard)DAGActivityBoard.render(ps); }\n"+board[end:]
marker='<script src="./shared-planner.js"></script>'
if html.count(marker)!=1:raise ValueError('Unexpected shared planner script')
html=html.replace(marker,'<script src="./status-containers.js"></script><script src="./activity-board.js"></script>'+marker,1)
for name in ['status-containers.js','activity-board.js']:
    Path('_site/'+name).write_text(Path('web/'+name).read_text(encoding='utf-8'),encoding='utf-8')
path.write_text(board,encoding='utf-8')
page.write_text(html,encoding='utf-8')
