#!/usr/bin/env python3
"""Check site links and require well-formed HTML and SVG.

Local links resolve against site/ when they start with /, and against the
file otherwise. External http(s) links must answer with a success status.
"""

from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
SVG_DIRS = [SITE, ROOT / "docs" / "brand" / "marks"]

REQUIRED = (
    "G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network",
    "Developed and distributed by Galion Labs",
    "Perpetual Open MIT License",
    "Copyright © 2026 Galion Labs. All rights reserved.",
    "Permission is hereby granted",
    "Free forever",
    "/ month",
    'data-price="plus"',
    'data-price="ultra"',
    'class="money-usd"',
    'class="money-eur"',
    'src="/assets/prices.js"',
    'src="/assets/region.js"',
    "not a separate product",
)
NAV_HREFS = ("/", "/one/", "/research/", "/operating-system/", "/voice/", "/labs/")
FORBIDDEN = (
    "add to cart",
    "subscribe now",
    "buy now",
    "one-time",
    "paid once",
    "pay once",
    "not a month",
    "one payment",
    "not a subscription",
)
LINK_ATTR = re.compile(
    r"""(?:href|src)\s*=\s*(?P<q>["'])(?P<url>.*?)(?P=q)""",
    re.IGNORECASE | re.DOTALL,
)
CSS_URL = re.compile(r"""url\(\s*(?P<q>["']?)(?P<url>.*?)(?P=q)\s*\)""", re.IGNORECASE)
ID_ATTR = re.compile(r"""\sid\s*=\s*(?P<q>["'])(?P<id>.*?)(?P=q)""", re.IGNORECASE)


class MarkupParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.stack: list[str] = []
        self.errors: list[str] = []
        self.void = {
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "source",
            "track",
            "wbr",
        }

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name.lower() == "id" and value:
                self.ids.append(value)
        if tag.lower() not in self.void:
            self.stack.append(tag.lower())

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in self.void:
            return
        if tag not in self.stack:
            self.errors.append(f"unexpected closing tag </{tag}>")
            return
        if self.stack[-1] != tag:
            self.errors.append(f"expected </{self.stack[-1]}>, found </{tag}>")
            while self.stack and self.stack[-1] != tag:
                self.stack.pop()
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def iter_files(folder: Path, suffix: str) -> list[Path]:
    return sorted(p for p in folder.rglob(f"*{suffix}") if p.is_file())


def local_target(page: Path, url: str) -> Path | None:
    path = url.split("#", 1)[0].split("?", 1)[0]
    if path == "":
        return page
    if path.startswith("/"):
        candidate = (SITE / path.lstrip("/")).resolve()
    else:
        candidate = (page.parent / path).resolve()
    try:
        candidate.relative_to(ROOT)
    except ValueError:
        return None
    if candidate.is_dir():
        candidate = candidate / "index.html"
    elif not candidate.suffix and not candidate.exists():
        index = candidate / "index.html"
        if index.exists():
            candidate = index
        elif Path(str(candidate) + ".html").exists():
            candidate = Path(str(candidate) + ".html")
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate


def fragment_of(url: str) -> str:
    if "#" not in url:
        return ""
    return url.split("#", 1)[1]


def ids_in(path: Path) -> set[str]:
    if path.suffix.lower() not in {".html", ".svg"}:
        return set()
    text = path.read_text(encoding="utf-8")
    return {match.group("id") for match in ID_ATTR.finditer(text)}


def check_external(url: str, cache: dict[str, str]) -> str:
    bare = url.split("#", 1)[0]
    if bare in cache:
        return cache[bare]
    request = urllib.request.Request(
        bare,
        method="GET",
        headers={"User-Agent": "galion-link-check"},
    )
    last = "no response"
    for _ in range(2):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                status = getattr(response, "status", 200)
                last = f"HTTP {status}"
                if 200 <= status < 400:
                    cache[bare] = ""
                    return ""
        except urllib.error.HTTPError as exc:
            last = f"HTTP {exc.code}"
            if exc.code in {429, 500, 502, 503, 504}:
                continue
            break
        except urllib.error.URLError as exc:
            last = str(exc.reason)
            continue
    cache[bare] = last
    return last


def check_svg(path: Path, errors: list[str]) -> None:
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        fail(errors, f"{path.relative_to(ROOT)}: SVG is not well-formed XML ({exc})")
        return
    root = tree.getroot()
    name = root.tag.rsplit("}", 1)[-1]
    if name != "svg":
        fail(errors, f"{path.relative_to(ROOT)}: root element is {name}, expected svg")
    if "xmlns" not in root.attrib and not root.tag.startswith("{http://www.w3.org/2000/svg}"):
        fail(errors, f"{path.relative_to(ROOT)}: SVG has no xmlns")


def check_html(path: Path, errors: list[str], cache: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    rel = path.relative_to(ROOT)
    if not text.lstrip().startswith("<!DOCTYPE html>"):
        fail(errors, f"{rel}: missing HTML5 doctype")
    parser = MarkupParser()
    parser.feed(text)
    parser.close()
    for message in parser.errors:
        fail(errors, f"{rel}: {message}")
    if parser.stack:
        fail(errors, f"{rel}: unclosed tags {', '.join(parser.stack)}")
    seen: set[str] = set()
    for item in parser.ids:
        if item in seen:
            fail(errors, f"{rel}: duplicate id {item}")
        seen.add(item)
    for line in REQUIRED:
        if line not in text:
            fail(errors, f"{rel}: missing required text {line!r}")
    for phrase in FORBIDDEN:
        if phrase in text.lower():
            fail(errors, f"{rel}: forbidden phrase {phrase!r}")
    if text.count('<p class="badge">Planned</p>') < 2:
        fail(errors, f"{rel}: Plus and Ultra must each be labelled Planned")
    if "paid_tiers" not in text:
        fail(errors, f"{rel}: missing paid_tiers")
    if "<form" in text.lower() or "checkout" in text.lower():
        fail(errors, f"{rel}: checkout or a payment form is not allowed")
    if not re.search(r"""data-price="ultra"[^>]*>€220</span><span class="period"> / month</span>""", text):
        fail(errors, f"{rel}: Ultra amount must show the configured monthly price")
    for href in NAV_HREFS:
        if f'href="{href}"' not in text:
            fail(errors, f"{rel}: nav is missing {href}")
    for match in LINK_ATTR.finditer(text):
        url = match.group("url").strip()
        check_url(path, url, errors, cache)
    for match in CSS_URL.finditer(text):
        url = match.group("url").strip()
        check_url(path, url, errors, cache)


def check_css(path: Path, errors: list[str], cache: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    for match in CSS_URL.finditer(text):
        check_url(path, match.group("url").strip(), errors, cache)


def check_url(page: Path, url: str, errors: list[str], cache: dict[str, str]) -> None:
    if url.startswith(("mailto:", "tel:", "data:")):
        return
    rel = page.relative_to(ROOT)
    if url.startswith(("http://", "https://")):
        problem = check_external(url, cache)
        if problem:
            fail(errors, f"{rel}: broken link {url} ({problem})")
        return
    if url.startswith("//"):
        fail(errors, f"{rel}: protocol-relative link {url}")
        return
    target = local_target(page, url)
    if target is None or not target.is_file():
        fail(errors, f"{rel}: broken link {url}")
        return
    fragment = fragment_of(url)
    if fragment and fragment not in ids_in(target):
        fail(errors, f"{rel}: missing fragment #{fragment} in {target.relative_to(ROOT)}")


def main() -> int:
    errors: list[str] = []
    cache: dict[str, str] = {}
    html_files = iter_files(SITE, ".html")
    if len(html_files) < 6:
        fail(errors, f"expected at least 6 HTML pages, found {len(html_files)}")
    for path in html_files:
        check_html(path, errors, cache)
    for path in iter_files(SITE, ".css"):
        check_css(path, errors, cache)
    seen_svg: set[Path] = set()
    for folder in SVG_DIRS:
        for path in iter_files(folder, ".svg"):
            if path in seen_svg:
                continue
            seen_svg.add(path)
            check_svg(path, errors)
    if not seen_svg:
        fail(errors, "no SVG files found")
    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s)")
        return 1
    print(f"Checked {len(html_files)} HTML pages and {len(seen_svg)} SVG files. No broken links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
