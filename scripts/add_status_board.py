"""Add the linked programme board and preserve activity extensions on native submit."""
from pathlib import Path
import shutil
path=Path('_site/index.html')
html=path.read_text(encoding='utf-8')
old="e.preventDefault();const c=blank();c.status=+$('editStatus').value;"
new="e.preventDefault();const c={...cell({id:edit.id},edit.b),...blank()};c.status=+$('editStatus').value;"
if html.count(old)!=1:raise ValueError('Unexpected Planner submit handler')
html=html.replace(old,new,1)
if html.count('</head>')!=1 or html.count('</body>')!=1:raise ValueError('Unexpected template')
html=html.replace('</head>','<style>'+Path('web/status-board.css').read_text(encoding='utf-8')+'</style></head>',1)
html=html.replace('</body>','<script src="./status-board.js"></script><script src="./start-trajectory.js"></script></body>',1)
shutil.copyfile('web/status-board.js','_site/status-board.js')
shutil.copyfile('web/start-trajectory.js','_site/start-trajectory.js')
path.write_text(html,encoding='utf-8')
