"""Apply header layout and static workflow documentation; leave application logic intact."""
from pathlib import Path
import re
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected HTML structure")
workflow = Path("web/workflow.html").read_text(encoding="utf-8")
html, count = re.subn(r'<section id="help"(?=\s|>)[^>]*>[\s\S]*?</section>', lambda match: workflow, html)
if count != 1:
    raise ValueError("Expected exactly one help section")
css = Path("web/header-information.css").read_text(encoding="utf-8")
css += "\n" + Path("web/workflow.css").read_text(encoding="utf-8")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
scripts = ("header-information.js", "activity-editor-ui.js", "banner-scene.js", "banner-layout.js", "login-centre.js")
deferred = {"banner-scene.js", "banner-layout.js", "login-centre.js"}
script_tags = ''.join(
    f'<script src="./{name}"' + (' defer' if name in deferred else '') + '></script>'
    for name in scripts
)
html = html.replace("</body>", script_tags + "</body>", 1)
for name in scripts:
    shutil.copyfile("web/" + name, "_site/" + name)
path.write_text(html, encoding="utf-8")
print("Applied header layout, workflow flowchart, activity editor and deferred banner scene; shared saving code unchanged")
