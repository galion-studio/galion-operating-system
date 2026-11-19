#!/usr/bin/env python3
"""Fail when docs/ARCHITECTURE.md and galion-status disagree on services and ports.

The ports table is the list. The command's --json output is the other list.
State words are not compared. This script dials nothing itself. The command
it runs dials 127.0.0.1 only.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "docs" / "ARCHITECTURE.md"
MANIFEST = ROOT / "tools" / "galion-status" / "Cargo.toml"
NAME = re.compile(r"[a-z][a-z0-9-]*")
STATES = {"up", "down", "not installed"}


def fail(message: str) -> None:
    print(f"check_architecture.py: {message}", file=sys.stderr)
    raise SystemExit(1)


def ports_table(text: str) -> list[tuple[str, int]]:
    start = text.find("\n## Ports\n")
    if start < 0:
        fail("docs/ARCHITECTURE.md has no Ports section")
    rest = text[start + 1 :]
    end = rest.find("\n## ")
    if end < 0:
        fail("Ports section has no following heading")
    section = rest[:end]
    rows: list[tuple[str, int]] = []
    in_table = False
    for line in section.splitlines():
        if line.startswith("| Port |"):
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) < 2 or cells[1] != "Service":
                fail("ports table needs a Service column")
            in_table = True
            continue
        if not in_table:
            continue
        if not line.startswith("|"):
            break
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not cells or not cells[0].isdigit():
            continue
        service = cells[1]
        if service.count("`") != 2 or not (service.startswith("`") and service.endswith("`")):
            fail(f"service cell must be one id in backticks: {service}")
        name = service[1:-1]
        if NAME.fullmatch(name) is None:
            fail(f"service id is not a command name: {name}")
        rows.append((name, int(cells[0])))
    if not rows:
        fail("ports table has no service rows")
    names = [name for name, _ in rows]
    ports = [port for _, port in rows]
    if len(names) != len(set(names)):
        fail("ports table repeats a service id")
    if len(ports) != len(set(ports)):
        fail("ports table repeats a port")
    if 18081 in ports:
        fail("port 18081 is the port the desktop does not bind")
    return rows


def command_rows() -> list[tuple[str, int]]:
    result = subprocess.run(
        [
            "cargo",
            "run",
            "--manifest-path",
            str(MANIFEST),
            "--locked",
            "--quiet",
            "--",
            "--json",
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        fail(f"galion-status --json exited {result.returncode}")
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        fail(f"--json is not JSON: {exc}")
    if not isinstance(payload, list):
        fail("--json must be an array")
    rows: list[tuple[str, int]] = []
    for item in payload:
        if not isinstance(item, dict):
            fail("--json row is not an object")
        name = item.get("name")
        port = item.get("port")
        state = item.get("state")
        if not isinstance(name, str) or NAME.fullmatch(name) is None:
            fail(f"--json name is not a service id: {name!r}")
        if not isinstance(port, int):
            fail(f"--json port is not an integer: {port!r}")
        if state not in STATES:
            fail(f"--json state is not up, down, or not installed: {state!r}")
        rows.append((name, port))
    return rows


def disagreement(doc_rows: list[tuple[str, int]], cmd_rows: list[tuple[str, int]]) -> list[str]:
    if doc_rows == cmd_rows:
        return []
    return [
        "docs/ARCHITECTURE.md and galion-status disagree on services or ports.",
        "doc: " + ", ".join(f"{name} {port}" for name, port in doc_rows),
        "cmd: " + ", ".join(f"{name} {port}" for name, port in cmd_rows),
    ]


def self_test() -> None:
    same = [("galion-welcome", 18711)]
    if disagreement(same, same):
        fail("self-test matched rows were reported as a disagreement")
    differed = disagreement(same, [("galion-welcome", 1)])
    if not differed:
        fail("self-test missed a port change")
    if disagreement([("a", 1), ("b", 2)], [("b", 2), ("a", 1)]) == []:
        fail("self-test missed a reordered list")


def main() -> int:
    self_test()
    doc_rows = ports_table(DOC.read_text(encoding="utf-8"))
    cmd_rows = command_rows()
    errors = disagreement(doc_rows, cmd_rows)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Architecture table and galion-status agree on {len(doc_rows)} services.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
