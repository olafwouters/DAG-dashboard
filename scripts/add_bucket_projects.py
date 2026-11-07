"""Add sub-project selection and recoverable bucket trash to the existing bucket manager."""
from pathlib import Path
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</body>") != 1 or 'id="bucketForm"' not in html or 'id="bucketList"' not in html:
    raise ValueError("Unexpected bucket manager template")
html = html.replace("</body>", '<script src="./bucket-projects.js"></script></body>', 1)
shutil.copyfile("web/bucket-projects.js", "_site/bucket-projects.js")
path.write_text(html, encoding="utf-8")
print("Added bucket sub-projects and recoverable bucket trash")
