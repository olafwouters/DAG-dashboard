"""Apply visual branding without modifying Planner behaviour."""
from pathlib import Path
import re

path = Path('_site/index.html')
html = path.read_text(encoding='utf-8')
html, titles = re.subn(r'<title>[^<]*</title>', '<title>DAG Dashboard</title>', html)
if titles != 1:
    raise ValueError('Expected exactly one document title')
html, headings = re.subn(r'<h1>Digitale (?:&amp;|&) AI-geletterdheid</h1>', '<h1>DAG Dashboard</h1>', html)
if headings != 1:
    raise ValueError('Unexpected product heading')
old_subtitle = '<p>Van eerste gesprek naar curriculumontwikkeling en professionalisering.</p>'
if html.count(old_subtitle) != 1:
    raise ValueError('Unexpected product subtitle')
html = html.replace(old_subtitle, '<p>Digitale &amp; AI-geletterdheid · Projectplanner &amp; voortgang</p>', 1)
if html.count('</head>') != 1 or html.count('</body>') != 1:
    raise ValueError('Unexpected HTML structure')
css = Path('web/liquid-lens.css').read_text(encoding='utf-8')
css += '\n' + Path('web/atlas-glass.css').read_text(encoding='utf-8')
html = html.replace('</head>', '<style>' + css + '</style></head>', 1)
banner = '''<section class="atlas-banner" id="atlasBanner" aria-label="DAG Dashboard introductie" data-paused="false"><div class="atlas-banner-copy"><span class="atlas-banner-kicker">Digitale &amp; AI-geletterdheid</span><div class="atlas-banner-title">DAG Dashboard</div><p>Planner · Status · Dashboard</p></div><div class="atlas-banner-art"><svg class="atlas-laptop" viewBox="0 0 220 140" aria-hidden="true" focusable="false"><rect x="35" y="12" width="150" height="100" rx="9" fill="#ffffff" fill-opacity=".09" stroke="#f5f1e9" stroke-width="2"/><rect x="44" y="23" width="132" height="78" rx="3" fill="#203532" fill-opacity=".7"/><g stroke-width="4" stroke-linecap="round"><path class="atlas-code" d="M57 39h64" stroke="#f5a23e"/><path class="atlas-code" d="M65 53h85" stroke="#d5e5dc"/><path class="atlas-code" d="M65 67h53" stroke="#f5a23e"/><path class="atlas-code" d="M57 81h79" stroke="#d5e5dc"/></g><path class="atlas-cursor" d="M144 77v9" stroke="#f5a23e" stroke-width="2"/><path d="M35 112L14 125Q12 130 22 130H198Q208 130 206 125L185 112Z" fill="#ffffff" fill-opacity=".14" stroke="#f5f1e9" stroke-width="2"/><path d="M91 118h38" stroke="#f5a23e" stroke-width="3" stroke-linecap="round"/></svg><button type="button" class="atlas-motion" id="atlasMotion" aria-pressed="false">Animatie pauzeren</button></div></section>'''
marker = '<h1>DAG Dashboard</h1>'
if html.count(marker) != 1:
    raise ValueError('Unexpected banner insertion point')
html = html.replace(marker, banner + marker, 1)
Path('_site/atlas-banner.js').write_text(Path('web/atlas-banner.js').read_text(encoding='utf-8'), encoding='utf-8')
html = html.replace('</body>', '<script src="./atlas-banner.js"></script></body>', 1)
path.write_text(html, encoding='utf-8')
