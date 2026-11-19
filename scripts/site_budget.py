#!/usr/bin/env python3
"""Measure the landing pages and refuse growth past the recorded ceiling.

Each page counts its own file plus the distinct local files it loads:
stylesheets, scripts, icons, images, and the font files those stylesheets
name. The same-origin `/api/region` read counts as one request and adds
no file bytes, because that response is not a file under site/.

An external resource URL fails. A class in site.css that no page uses
fails. An img without a width and a height fails.

site/budget.txt, when it exists, holds one measured line per page, copied
from a CI run of this script:

    / bytes=12345 requests=16

A later run fails when a page's bytes or requests are higher than that line.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
BUDGET = SITE / "budget.txt"
CSS = SITE / "assets" / "site.css"

TAG = re.compile(r"<(?P<tag>link|script|img)\b(?P<attrs>[^>]*)>", re.IGNORECASE)
ATTR = re.compile(
    r"""(?P<name>[:\w-]+)\s*=\s*(?P<q>["'])(?P<value>.*?)(?P=q)""",
    re.IGNORECASE | re.DOTALL,
)
CLASS_ATTR = re.compile(r"""class\s*=\s*(?P<q>["'])(?P<value>.*?)(?P=q)""", re.IGNORECASE)
CSS_URL = re.compile(r"""url\(\s*(?P<q>["']?)(?P<url>.*?)(?P=q)\s*\)""", re.IGNORECASE)
CSS_CLASS = re.compile(r"\.([A-Za-z_][\w-]*)")
REGION = "/api/region"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def parse_attrs(blob: str) -> dict[str, str]:
    return {match.group("name").lower(): match.group("value") for match in ATTR.finditer(blob)}


def pages() -> list[Path]:
    found = sorted(path for path in SITE.rglob("*.html") if path.is_file())
    return found


def page_key(path: Path) -> str:
    rel = path.relative_to(SITE).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def local_file(page: Path, url: str) -> Path | None:
    path = url.split("#", 1)[0].split("?", 1)[0]
    if path == "":
        return page
    if path.startswith("/"):
        candidate = (SITE / path.lstrip("/")).resolve()
    else:
        candidate = (page.parent / path).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate


def is_external(url: str) -> bool:
    return url.startswith(("http://", "https://", "//"))


def linked_styles(html: str) -> list[str]:
    urls: list[str] = []
    for match in TAG.finditer(html):
        if match.group("tag").lower() != "link":
            continue
        attrs = parse_attrs(match.group("attrs"))
        rel = attrs.get("rel", "").lower().split()
        if "stylesheet" in rel and attrs.get("href"):
            urls.append(attrs["href"])
    return urls


def collect(page: Path, errors: list[str]) -> tuple[int, int]:
    html = page.read_text(encoding="utf-8")
    key = page_key(page)
    files: dict[Path, str] = {page.resolve(): str(page.relative_to(ROOT))}

    for match in TAG.finditer(html):
        tag = match.group("tag").lower()
        attrs = parse_attrs(match.group("attrs"))
        if tag == "img":
            if not attrs.get("width") or not attrs.get("height"):
                fail(errors, f"{key}: img {attrs.get('src', '')} needs width and height")
            url = attrs.get("src", "")
        elif tag == "script":
            url = attrs.get("src", "")
        else:
            rel = attrs.get("rel", "").lower().split()
            if not ({"stylesheet", "icon", "preload"} & set(rel)):
                continue
            url = attrs.get("href", "")
        if not url:
            continue
        add_url(page, url, files, errors, key)

    for href in linked_styles(html):
        sheet = local_file(page, href)
        if sheet is None or not sheet.is_file():
            continue
        text = sheet.read_text(encoding="utf-8")
        for found in CSS_URL.finditer(text):
            add_url(sheet, found.group("url").strip(), files, errors, key)

    loaded = "\n".join(
        path.read_text(encoding="utf-8")
        for path in files
        if path.suffix == ".js"
    )
    requests = len(files)
    if REGION in loaded:
        requests += 1
    if re.search(r"https?://", loaded):
        fail(errors, f"{key}: a script names another host")

    weight = 0
    for path in files:
        weight += path.stat().st_size
    return requests, weight


def add_url(owner: Path, url: str, files: dict[Path, str], errors: list[str], key: str) -> None:
    if url.startswith(("data:", "mailto:", "tel:")):
        return
    if is_external(url):
        fail(errors, f"{key}: external resource {url}")
        return
    target = local_file(owner, url)
    if target is None or not target.is_file():
        fail(errors, f"{key}: missing resource {url}")
        return
    files[target.resolve()] = str(target.relative_to(ROOT))


def unused_classes(errors: list[str]) -> None:
    css = CSS.read_text(encoding="utf-8")
    stripped = re.sub(r"url\([^)]*\)", "", css)
    stripped = re.sub(r"/\*.*?\*/", "", stripped, flags=re.DOTALL)
    classes = set(CSS_CLASS.findall(stripped))
    tokens: set[str] = set()
    for page in pages():
        for match in CLASS_ATTR.finditer(page.read_text(encoding="utf-8")):
            tokens.update(match.group("value").split())
    missing = sorted(classes - tokens)
    if missing:
        fail(errors, "site.css has unused classes: " + ", ".join(missing))


def unused_scripts(errors: list[str]) -> None:
    referenced: set[Path] = set()
    for page in pages():
        html = page.read_text(encoding="utf-8")
        for match in TAG.finditer(html):
            if match.group("tag").lower() != "script":
                continue
            src = parse_attrs(match.group("attrs")).get("src", "")
            if not src or is_external(src):
                continue
            target = local_file(page, src)
            if target is not None:
                referenced.add(target.resolve())
    for path in sorted((SITE / "assets").glob("*.js")):
        if path.resolve() not in referenced:
            fail(errors, f"unreferenced script {path.relative_to(ROOT)}")


def read_budget() -> dict[str, tuple[int, int]] | None:
    if not BUDGET.is_file():
        return None
    ceiling: dict[str, tuple[int, int]] = {}
    for line in BUDGET.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.fullmatch(r"(\S+) bytes=(\d+) requests=(\d+)", line)
        if not match:
            raise SystemExit(f"site/budget.txt has an unreadable line: {line}")
        ceiling[match.group(1)] = (int(match.group(2)), int(match.group(3)))
    if not ceiling:
        raise SystemExit("site/budget.txt is empty")
    return ceiling


def main() -> int:
    errors: list[str] = []
    html_pages = pages()
    if len(html_pages) < 6:
        fail(errors, f"expected at least 6 HTML pages, found {len(html_pages)}")
    unused_classes(errors)
    unused_scripts(errors)
    measured: list[tuple[str, int, int]] = []
    for path in html_pages:
        requests, weight = collect(path, errors)
        measured.append((page_key(path), weight, requests))
    measured.sort()
    for key, weight, requests in measured:
        print(f"{key} bytes={weight} requests={requests}")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    ceiling = read_budget()
    if ceiling is None:
        print("site-budget ceiling=unset")
        return 0
    seen = {key for key, _, _ in measured}
    if set(ceiling) != seen:
        extra = sorted(set(ceiling) - seen)
        missing = sorted(seen - set(ceiling))
        print(
            f"site/budget.txt pages do not match the site (extra={extra} missing={missing})",
            file=sys.stderr,
        )
        return 1
    over = False
    for key, weight, requests in measured:
        cap_bytes, cap_requests = ceiling[key]
        if weight > cap_bytes or requests > cap_requests:
            print(
                f"{key} grew past the measured ceiling "
                f"(bytes {weight}>{cap_bytes} or requests {requests}>{cap_requests})",
                file=sys.stderr,
            )
            over = True
    return 1 if over else 0


if __name__ == "__main__":
    sys.exit(main())
