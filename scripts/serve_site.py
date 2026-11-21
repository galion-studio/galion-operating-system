#!/usr/bin/env python3
"""Serve the landing pages, /boot/ from desktop/boot, and /api/region.

/api/region reads the CF-IPCountry header on this request and returns
{"country":"DE"}. It does not call a geo service and it does not record
an address. This serves your own machine. It is not a deployment.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
BOOT = ROOT / "desktop" / "boot"
ENDPOINT = ROOT / "functions" / "api" / "region.js"

BOOT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".rs": "text/plain; charset=utf-8",
    ".ts": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
}


class SiteHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/region":
            self.serve_region()
            return
        if path == "/boot" or path.startswith("/boot/"):
            self.serve_boot(path)
            return
        super().do_GET()

    def serve_boot(self, path: str) -> None:
        if path == "/boot":
            self.send_response(302)
            self.send_header("Location", "/boot/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        rel = path[len("/boot/") :]
        if rel == "":
            rel = "index.html"
        parts = Path(rel).parts
        if not parts or any(part in ("", ".", "..") for part in parts):
            self.send_error(404)
            return
        boot_root = BOOT.resolve()
        target = boot_root.joinpath(*parts)
        try:
            target = target.resolve(strict=True)
        except FileNotFoundError:
            self.send_error(404)
            return
        if target != boot_root and boot_root not in target.parents:
            self.send_error(404)
            return
        if not target.is_file():
            self.send_error(404)
            return
        body = target.read_bytes()
        ctype = BOOT_TYPES.get(target.suffix.lower(), "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_region(self) -> None:
        raw = self.headers.get("CF-IPCountry", "")
        header = raw.splitlines()[0][:16] if raw else ""
        node = shutil.which("node") or "node"
        try:
            proc = subprocess.run(
                [node, str(ENDPOINT)],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
                env={
                    "GALION_REGION_CLI": "1",
                    "GALION_CF_IPCOUNTRY": header,
                },
            )
        except (OSError, subprocess.TimeoutExpired):
            proc = None
        if proc is not None and proc.returncode == 0 and proc.stdout.startswith("{"):
            body = proc.stdout.encode("utf-8")
        else:
            body = b'{"country":""}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args) -> None:
        # Request line and status only. Do not record the client address.
        sys.stderr.write((fmt % args) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve site/ with /api/region")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.host != "127.0.0.1":
        print("error: the preview listens on 127.0.0.1 only", file=sys.stderr)
        return 1
    handler = partial(SiteHandler, directory=str(SITE))
    try:
        server = ThreadingHTTPServer((args.host, args.port), handler)
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
    sys.exit(main())
