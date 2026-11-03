"""Add a connected status-board view without changing the planner data model."""
from pathlib import Path
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</body>") != 1 or html.count("</head>") != 1:
    raise ValueError("Unexpected planner template")
css = Path("web/status-board.css").read_text(encoding="utf-8")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
html = html.replace("</body>", '<script src="./status-board.js"></script></body>', 1)
shutil.copyfile("web/status-board.js", "_site/status-board.js")
path.write_text(html, encoding="utf-8")
print("Added status view connected to existing planner cells and save path")
