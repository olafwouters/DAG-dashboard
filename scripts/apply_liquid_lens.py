"""Apply Liquid Lens branding and CSS without modifying planner behaviour."""
from pathlib import Path
import re

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
html, titles = re.subn(r"<title>[^<]*</title>", "<title>DAG Dashboard</title>", html)
if titles != 1:
    raise ValueError("Expected exactly one document title")
html, headings = re.subn(r"<h1>Digitale (?:&amp;|&) AI-geletterdheid</h1>", "<h1>DAG Dashboard</h1>", html)
if headings != 1:
    raise ValueError("Unexpected product heading")
old_subtitle = "<p>Van eerste gesprek naar curriculumontwikkeling en professionalisering.</p>"
if html.count(old_subtitle) != 1:
    raise ValueError("Unexpected product subtitle")
html = html.replace(old_subtitle, "<p>Digitale &amp; AI-geletterdheid · Projectplanner &amp; voortgang</p>", 1)
if html.count("</head>") != 1:
    raise ValueError("Unexpected HTML structure")
css = Path("web/liquid-lens.css").read_text(encoding="utf-8")
html = html.replace("</head>", "<style>" + css + "</style></head>", 1)
path.write_text(html, encoding="utf-8")
print("Applied DAG Dashboard name and Liquid Lens header/navigation; functional code unchanged")
