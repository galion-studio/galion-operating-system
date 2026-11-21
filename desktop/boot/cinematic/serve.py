#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE at the repository root. This file does not restate it.
"""Serve the cinematic boot page on 127.0.0.1 only.

The page is /boot/cinematic/. The startup sound is /boot/sounds/.
The two webfonts are the files already in site/assets/fonts/. This
process does not open any other address and it does not log a client
address.
"""

from __future__ import annotations

import argparse
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[3]
BOOT = ROOT / "desktop" / "boot"
FONTS = ROOT / "site" / "assets" / "fonts"
FONT_FILES = {
    "jost-500.woff2",
    "ibm-plex-sans-400.woff2",
    "ibm-plex-mono-400.woff2",
}

TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".glsl": "text/plain; charset=utf-8",
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        host = (self.headers.get("Host") or "").split(":")[0]
        if host != "127.0.0.1":
            self.send_error(403)
            return
        path = unquote(urlparse(self.path).path)
        if path in ("/", "/boot", "/boot/"):
            self.send_response(302)
            self.send_header("Location", "/boot/cinematic/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if path.startswith("/assets/fonts/"):
            name = path[len("/assets/fonts/") :]
            if name not in FONT_FILES:
                self.send_error(404)
                return
            self._send(FONTS / name)
            return
        if path == "/boot/cinematic":
            self.send_response(302)
            self.send_header("Location", "/boot/cinematic/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if not path.startswith("/boot/"):
            self.send_error(404)
            return
        rel = path[len("/boot/") :]
        if rel == "":
            rel = "cinematic/index.html"
        if rel.endswith("/"):
            rel += "index.html"
        parts = Path(rel).parts
        if not parts or any(part in ("", ".", "..") for part in parts):
            self.send_error(404)
            return
        target = BOOT.joinpath(*parts)
        try:
            target = target.resolve(strict=True)
        except FileNotFoundError:
            self.send_error(404)
            return
        boot_root = BOOT.resolve()
        if target != boot_root and boot_root not in target.parents:
            self.send_error(404)
            return
        self._send(target)

    def _send(self, target: Path) -> None:
        if not target.is_file():
            self.send_error(404)
            return
        body = target.read_bytes()
        ctype = TYPES.get(target.suffix.lower(), "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write((fmt % args) + "\n")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Serve the Galion OS boot page on 127.0.0.1")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args(argv)
    if args.host != "127.0.0.1":
        print("error: the boot page listens on 127.0.0.1 only", file=sys.stderr)
        return 1
    try:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as exc:
        reason = exc.strerror or str(exc)
        print(f"error: cannot listen on {args.host}:{args.port} ({reason})", file=sys.stderr)
        return 1
    print(f"PORT {server.server_address[1]}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
