#!/usr/bin/env python3
# G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
# Developed and distributed by Galion Labs
# Perpetual Open MIT License
# Copyright © 2026 Galion Labs. All rights reserved.
# The licence text is LICENSE. This file does not restate it.
"""Galion OS: read-only loopback server for existing HORBM/galion-knowledge cards.
GET/HEAD only. Binds 127.0.0.1. Never writes to the card tree.
"""
import http.server
import os
import sys
import urllib.parse
from pathlib import Path

HOST = "127.0.0.1"
PORT = int(os.environ.get("KNOWLEDGE_PORT", "7900"))
ROOT = Path(os.environ.get("KNOWLEDGE_ROOT", "/mnt/g/galion/knowledge")).resolve()
# Serve cards and schema only. Memory diary/sqlite and archive stay unexposed.
ALLOWED_TOP = {"core", "shards", "catalog.json", "schema.json", "SCHEMA.md", "README.md"}

class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "GalionKnowledgeRO/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))

    def _safe(self):
        raw = urllib.parse.unquote(self.path.split("?", 1)[0])
        if raw == "/":
            return ROOT, True
        rel = raw.lstrip("/").replace("\\", "/")
        top = rel.split("/", 1)[0]
        if top not in ALLOWED_TOP:
            return None, False
        cand = (ROOT / rel).resolve()
        try:
            cand.relative_to(ROOT)
        except ValueError:
            return None, False
        return cand, False

    def _send(self, code, body, ctype="text/plain; charset=utf-8"):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def do_GET(self):
        self._serve()

    def do_HEAD(self):
        self._serve()

    def do_POST(self):
        self._send(405, "read-only\n")

    def do_PUT(self):
        self._send(405, "read-only\n")

    def do_DELETE(self):
        self._send(405, "read-only\n")

    def do_PATCH(self):
        self._send(405, "read-only\n")

    def _serve(self):
        path, is_root = self._safe()
        if path is None:
            self._send(404, "not found\n")
            return
        if is_root or path.is_dir():
            if is_root:
                entries = sorted(p for p in ROOT.iterdir() if p.name in ALLOWED_TOP)
                title = "Galion OS knowledge (read-only)"
            else:
                entries = sorted(path.iterdir())
                title = str(path.relative_to(ROOT))
            lines = [
                "<!doctype html><meta charset=utf-8><title>%s</title>" % title,
                "<h1>%s</h1><p>Read-only cards on loopback. No writes.</p><ul>" % title,
            ]
            if not is_root:
                lines.append('<li><a href="../">..</a></li>')
            for p in entries:
                name = p.name + ("/" if p.is_dir() else "")
                href = urllib.parse.quote(name)
                lines.append('<li><a href="%s">%s</a></li>' % (href, name))
            lines.append("</ul>")
            self._send(200, "\n".join(lines), "text/html; charset=utf-8")
            return
        if not path.is_file():
            self._send(404, "not found\n")
            return
        data = path.read_bytes()
        ext = path.suffix.lower()
        types = {".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
                 ".txt": "text/plain; charset=utf-8", ".html": "text/html; charset=utf-8"}
        self._send(200, data, types.get(ext, "application/octet-stream"))

class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = True

def main():
    if not ROOT.is_dir():
        sys.stderr.write("knowledge root missing: %s\n" % ROOT)
        sys.exit(1)
    httpd = Server((HOST, PORT), Handler)
    sys.stderr.write("Galion OS knowledge read-only http://%s:%s/ root=%s\n" % (HOST, PORT, ROOT))
    httpd.serve_forever()

if __name__ == "__main__":
    main()
