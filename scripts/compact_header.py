"""Apply header layout and static workflow documentation; leave application logic intact."""
from pathlib import Path
import re
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected HTML structure")
workflow = Path("web/workflow.html").read_text(encoding="utf-8")
html, count = re.subn(r'<section id="help"\b[^>]*>[\s\S]*?</section>', lambda match: workflow, html)
if count != 1:
    raise ValueError("Expected exactly one help section")
css = Path("web/header-information.css").read_text(encoding="utf-8")
css += "\n" + Path("web/workflow.css").read_text(encoding="utf-8")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
html = html.replace("</body>", '<script src="./header-information.js"></script></body>', 1)
shutil.copyfile("web/header-information.js", "_site/header-information.js")
path.write_text(html, encoding="utf-8")
print("Applied header layout and workflow flowchart; shared saving code unchanged")
