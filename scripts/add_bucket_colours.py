"""Add bucket colour controls only. Leave existing saving and shared refreshes untouched."""
from pathlib import Path
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected HTML structure")
css = Path("web/bucket-colours.css").read_text(encoding="utf-8")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
html = html.replace("</body>", '<script src="./bucket-colours.js"></script></body>', 1)
shutil.copyfile("web/bucket-colours.js", "_site/bucket-colours.js")
path.write_text(html, encoding="utf-8")
print("Added native colour circles for creating, managing and identifying buckets")
