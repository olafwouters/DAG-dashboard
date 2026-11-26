"""Build the static DAG planner for GitHub Pages; no planner activity data is published."""
import argparse
import json
from pathlib import Path
import re
import shutil
from urllib.request import Request, urlopen

CATALOGUE_URL = "https://raw.githubusercontent.com/olafwouters/Curriculum-Atlas/89c0b5422b402b1d6fb7bbd7b12297e1aeebd8d0/data/catalogue-cache/nl-2026.json"
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
ICON_TAGS = ('<link rel="icon" href="icons/favicon.ico" sizes="any">'
             '<link rel="icon" href="icons/favicon-32.png" type="image/png" sizes="32x32">'
             '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
             '<link rel="manifest" href="manifest.webmanifest">'
             '<meta name="theme-color" content="#203532">')


def programmes(data):
    if "programs" in data:
        rows = data["programs"]
    else:
        rows = []
        for item in data["results"]:
            path = str(item.get("path", ""))
            if "/programme/" not in path.lower():
                continue
            if not re.fullmatch(r"/nl/Programme/20\d{2}/[A-Za-z0-9_-]+", path, re.I):
                raise ValueError("Unexpected programme URL: " + path)
            rows.append({"id": path.split("/")[-1], "name": item["name"],
                         "cluster": item["cluster"], "level": item.get("level", ""),
                         "form": item.get("mode", ""), "url": "https://catalogue.hanze.nl" + path,
                         "sourceYear": path.split("/")[3], "type": "programme", "sourceFile": ""})
    if len(rows) != 139 or len({row["id"] for row in rows}) != 139:
        raise ValueError("Expected exactly 139 programmes with unique IDs")
    if any(not str(row.get(key, "")).strip() for row in rows for key in ("id", "name", "cluster")):
        raise ValueError("Missing programme metadata")
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="Index.html")
    parser.add_argument("--catalogue", help="Optional local JSON for offline builds")
    parser.add_argument("--output", default="_site")
    args = parser.parse_args()
    html = Path(args.source).read_text(encoding="utf-8")
    if args.catalogue:
        data = json.loads(Path(args.catalogue).read_text(encoding="utf-8"))
    else:
        request = Request(CATALOGUE_URL, headers={"User-Agent": "DAG-dashboard-Pages-build"})
        with urlopen(request, timeout=90) as response:
            data = json.load(response)
    rows = programmes(data)
    match = re.search(r"const ORG_SEED=(\[.*?\]);", html, re.S)
    organisations = json.loads(match.group(1)) if match else []
    if len(organisations) != 21 or len({row["id"] for row in organisations}) != 21:
        raise ValueError("Expected 21 organisational units in the planner template")
    payload = json.dumps({"programs": rows, "source": CATALOGUE_URL}, ensure_ascii=False).replace("<", "\\u003c")
    pattern = r'(<script id="embeddedCatalogue" type="application/json">)[\s\S]*?(</script>)'
    html, count = re.subn(pattern, lambda m: m[1] + payload + m[2], html)
    if count != 1:
        raise ValueError("Expected one embeddedCatalogue element")
    html = html.replace("HANZE · PROJECTWERKRUIMTE · LOKAAL PROTOTYPE", "HANZE · DAG PROJECTWERKRUIMTE")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    icons_ready = (WEB_DIR / "icons" / "icon-512.png").is_file() and (WEB_DIR / "manifest.webmanifest").is_file()
    if icons_ready:
        shutil.copytree(WEB_DIR / "icons", output / "icons", dirs_exist_ok=True)
        shutil.copyfile(WEB_DIR / "manifest.webmanifest", output / "manifest.webmanifest")
        if 'rel="manifest"' not in html:
            html = html.replace("</head>", ICON_TAGS + "</head>", 1)
    else:
        print("web/icons/icon-512.png not found; building without app icons")
    (output / "index.html").write_text(html, encoding="utf-8")
    (output / ".nojekyll").write_text("", encoding="utf-8")
    (output / "build-info.json").write_text(json.dumps({"programmes": len(rows),
        "organisations": len(organisations), "source": CATALOGUE_URL}, indent=2), encoding="utf-8")
    print(f"Built {output / 'index.html'}: {len(rows)} programmes, {len(organisations)} organisational units")


if __name__ == "__main__":
    main()
