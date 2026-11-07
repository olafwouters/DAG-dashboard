"""Add the read-only aggregated dashboard and browser PDF download."""
from pathlib import Path
import shutil
p=Path('_site/index.html')
html=p.read_text(encoding='utf-8')
if html.count('</body>')!=1 or 'id="dashboard"' not in html:
    raise ValueError('Unexpected dashboard template')
html=html.replace('</body>','<script src="./reporting-dashboard.js"></script></body>',1)
shutil.copyfile('web/reporting-dashboard.js','_site/reporting-dashboard.js')
p.write_text(html,encoding='utf-8')
