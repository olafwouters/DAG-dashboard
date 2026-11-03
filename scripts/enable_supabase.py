"""Enable authenticated Supabase saving on the already-built Pages application."""
from pathlib import Path
import shutil

path = Path("_site/index.html")
html = path.read_text(encoding="utf-8")
if html.count("</head>") != 1 or html.count("</body>") != 1:
    raise ValueError("Unexpected planner template")
style = """<style>
html:not(.dag-authenticated) main,html:not(.dag-authenticated) .header-actions{display:none!important}
.dag-sync-panel{margin:18px 30px;padding:18px 22px;background:#fff;border:1px solid #e5e5e8;border-radius:18px}
.dag-sync-panel h2{margin:0 0 8px}.dag-sync-panel form,.dag-sync-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.dag-sync-panel label input{display:block}.dag-sync-actions{margin-top:12px}.dag-sync-panel [hidden]{display:none!important}
@media print{.dag-sync-panel{display:none!important}}
</style>"""
html = html.replace("</head>", style + "</head>", 1)
html = html.replace("Huidige werkruimte vervangen door deze back-up", "Gedeelde werkruimte voor alle gebruikers vervangen door deze back-up")
html = html.replace("Alle plannerinvoer en eigen catalogusrecords verwijderen?", "Alle gedeelde plannerinvoer voor alle gebruikers en eigen catalogusrecords verwijderen?")
html = html.replace("Activiteit opgeslagen; dashboard bijgewerkt.", "Activiteit lokaal bijgewerkt; gedeelde opslag wordt gecontroleerd.")
html = html.replace("</body>", '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="./shared-planner.js"></script></body>', 1)
shutil.copyfile("web/shared-planner.js", "_site/shared-planner.js")
path.write_text(html, encoding="utf-8")
print("Enabled Supabase sign-in and shared saving; SQL setup and approved accounts are required")
