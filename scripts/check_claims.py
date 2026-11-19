#!/usr/bin/env python3
"""Check feature claims on the landing pages against this repository.

Pricing sections are left out of the wording check. Everywhere else, a
feature that is not built is called planned. A claim that names work in
this repository links a file that is on disk.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

# Paths the pages cite for work that is already in this tree.
EVIDENCE = {
    "index.html": (
        "README.md",
        "docs/ARCHITECTURE.md",
        "galion-init/README.md",
    ),
    "operating-system/index.html": (
        "galion-init/README.md",
        "docs/voice-profile/voice-first.md",
        "docs/voice-profile/hermes-later.md",
        "docs/voice-profile/FB0-SURFACE.md",
    ),
    "voice/index.html": (
        "docs/voice-profile/FB0-SURFACE.md",
        "docs/ARCHITECTURE.md",
        "galion-init/README.md",
    ),
    "one/index.html": (
        "galion-init/README.md",
        "docs/brand/BRANDING-V2.md",
    ),
    "research/index.html": (
        "galion-init/README.md",
        "docs/ARCHITECTURE.md",
    ),
    "labs/index.html": ("labs/README.md",),
}

# Present-tense claims the pages used to make about work that is not built.
ABSENT = (
    "sit there",
    "It is built for",
    "listens, and it speaks",
    "is the operating system at the root",
    "lives inside Obsidian",
    "already listens",
    "Ready to drop in",
    "in development",
)


def outside_pricing(text: str) -> str:
    head, sep, _tail = text.partition('<section id="pricing"')
    return head if sep else text


def main() -> int:
    errors: list[str] = []
    pages = sorted(path for path in SITE.rglob("*.html") if path.is_file())
    if len(pages) < 6:
        errors.append(f"expected at least 6 HTML pages, found {len(pages)}")
    seen = {path.relative_to(SITE).as_posix() for path in pages}
    missing_pages = sorted(set(EVIDENCE) - seen)
    if missing_pages:
        errors.append("claim list has no page for " + ", ".join(missing_pages))
    for path in pages:
        rel = path.relative_to(SITE).as_posix()
        text = path.read_text(encoding="utf-8")
        body = outside_pricing(text)
        lower = body.lower()
        if "planned" not in lower:
            errors.append(f"{rel}: a feature outside pricing is not called planned")
        for phrase in ABSENT:
            if phrase.lower() in lower:
                errors.append(f"{rel}: still says {phrase!r} outside pricing")
        for evidence in EVIDENCE.get(rel, ()):
            target = ROOT / evidence
            if not target.is_file():
                errors.append(f"{rel}: evidence file is missing: {evidence}")
            if evidence not in text:
                errors.append(f"{rel}: does not link {evidence}")
    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s)")
        return 1
    print(f"Checked {len(pages)} pages. Feature claims link files in this repository, or say planned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
