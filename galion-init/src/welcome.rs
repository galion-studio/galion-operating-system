// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Galion Labs

//! The local welcome page. Pure text in, HTML out.
//!
//! The `galion-welcome` binary binds the loopback interface and fills a
//! [`UnitSnapshot`] from the machine. This module does not bind, spawn, or
//! talk to systemd itself.

use std::fmt::Write;

/// IPv4 loopback port for the welcome page. The systemd unit names this port.
pub const WELCOME_PORT: u16 = 18711;

const TOKENS_CSS: &str = include_str!("../../site/assets/tokens.css");

pub const STATE_UP: &str = "Up";
pub const STATE_FINISHED: &str = "Finished";
pub const STATE_COMING: &str = "Coming up";
pub const STATE_DOWN: &str = "Down";
pub const STATE_ABSENT: &str = "Not on this machine";
pub const STATE_UNREAD: &str = "Not read";

const EXTRA_LIMIT: usize = 32;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ServiceRow {
    pub name: String,
    pub role: String,
    pub state: &'static str,
    pub tone: &'static str,
    /// Loopback page for this service, set only while its state is [`STATE_UP`].
    pub href: Option<String>,
}

/// Texts collected by the binary. `None` means that read failed.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct UnitSnapshot {
    /// `systemctl list-units --all --plain --no-legend galion-*`
    pub list_units: Option<String>,
    /// `systemctl list-unit-files --plain --no-legend galion-*`
    pub list_files: Option<String>,
    /// `systemctl show` for the desktop console, which is not a `galion-*` unit.
    pub desktop_show: Option<String>,
}

struct Known {
    id: &'static str,
    name: &'static str,
    role: &'static str,
    desktop: bool,
}

const KNOWN: &[Known] = &[
    Known {
        id: "galion-os.target",
        name: "Galion OS",
        role: "The boot target.",
        desktop: false,
    },
    Known {
        id: "galion-init.service",
        name: "Init",
        role: "Prints the desktop plan, then finishes.",
        desktop: false,
    },
    Known {
        id: "galion-welcome.service",
        name: "Welcome",
        role: "This page.",
        desktop: false,
    },
    Known {
        id: "openmind-desktop.service",
        name: "Open Mind",
        role: "Desktop console.",
        desktop: true,
    },
    Known {
        id: "galion-research.service",
        name: "Research",
        role: "Research desk.",
        desktop: false,
    },
    Known {
        id: "galion-voiced.service",
        name: "Voice",
        role: "Galion Voice.",
        desktop: false,
    },
];

#[derive(Clone, Debug)]
struct Live {
    id: String,
    load: String,
    active: String,
    sub: String,
}

/// Rows in page order. Known services first, then any other `galion-*` unit.
pub fn rows_from_snapshot(snapshot: &UnitSnapshot) -> Vec<ServiceRow> {
    let units = snapshot.list_units.as_deref().map(parse_list_units);
    let files = snapshot.list_files.as_deref().map(parse_list_files);
    let desktop = snapshot.desktop_show.as_deref().map(parse_show);
    let mut rows = Vec::new();
    for known in KNOWN {
        let (state, tone) = if known.id == "galion-research.service" {
            prefer(
                listed_state(units.as_ref(), files.as_ref(), known.id),
                listed_state(
                    units.as_ref(),
                    files.as_ref(),
                    "galion-research-pi5.service",
                ),
            )
        } else if known.desktop {
            desktop_state(desktop.as_ref(), known.id)
        } else {
            listed_state(units.as_ref(), files.as_ref(), known.id)
        };
        rows.push(ServiceRow {
            name: known.name.to_string(),
            role: known.role.to_string(),
            href: href_for(known.id, state),
            state,
            tone,
        });
    }
    if let Some(units) = units.as_ref() {
        let mut extra_ids: Vec<String> = units
            .iter()
            .map(|live| live.id.clone())
            .filter(|id| is_galion_unit(id) && !known_id(id) && !research_alias(id))
            .collect();
        if let Some(files) = files.as_ref() {
            for id in files {
                if is_galion_unit(id)
                    && !known_id(id)
                    && !research_alias(id)
                    && !extra_ids.iter().any(|have| have == id)
                {
                    extra_ids.push(id.clone());
                }
            }
        }
        extra_ids.sort();
        extra_ids.dedup();
        let hidden = extra_ids.len().saturating_sub(EXTRA_LIMIT);
        for id in extra_ids.into_iter().take(EXTRA_LIMIT) {
            let (state, tone) = listed_state(Some(units), files.as_ref(), &id);
            rows.push(ServiceRow {
                name: id,
                role: "Galion unit.".to_string(),
                state,
                tone,
                href: None,
            });
        }
        if hidden > 0 {
            rows.push(ServiceRow {
                name: "Other units".to_string(),
                role: format!("{hidden} more Galion units are on this machine."),
                state: STATE_UNREAD,
                tone: "unread",
                href: None,
            });
        }
    }
    rows
}

pub fn render_page(rows: &[ServiceRow]) -> String {
    let mut list = String::new();
    for row in rows {
        let name = match &row.href {
            Some(href) => format!("<a href=\"{}\">{}</a>", escape(href), escape(&row.name)),
            None => escape(&row.name),
        };
        let _ = write!(
            list,
            "<li class=\"{tone}\"><span class=\"mark {tone}\" aria-hidden=\"true\"></span><div><h2>{name}</h2><p>{role}</p></div><p class=\"state\">{state}</p></li>",
            tone = row.tone,
            name = name,
            role = escape(&row.role),
            state = escape(row.state),
        );
    }
    document(
        "Each Galion service on this machine, and whether it is up.",
        &format!("<ul id=\"services\">{list}</ul>"),
        true,
    )
}

/// Answer one HTTP request. `rows` is used for `GET` and `HEAD` of the page.
pub fn answer(request: &str, rows: &[ServiceRow]) -> Vec<u8> {
    let (method, path) = request_target(request);
    let method = method.to_ascii_uppercase();
    let (status, allow, body) = match (method.as_str(), path) {
        ("GET" | "HEAD", "/" | "/index.html") => (200, false, render_page(rows)),
        ("GET" | "HEAD", _) => (
            404,
            false,
            document(
                "This machine has one page.",
                "<p class=\"back\"><a href=\"/\">Welcome</a></p>",
                false,
            ),
        ),
        _ => (
            405,
            true,
            document(
                "This page is only for reading.",
                "<p class=\"back\"><a href=\"/\">Welcome</a></p>",
                false,
            ),
        ),
    };
    let reason = match status {
        200 => "OK",
        404 => "Not Found",
        _ => "Method Not Allowed",
    };
    let allow_header = if allow { "Allow: GET, HEAD\r\n" } else { "" };
    let head = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {len}\r\nCache-Control: no-store\r\nContent-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\n{allow_header}Connection: close\r\n\r\n",
        len = body.len(),
    );
    let mut bytes = head.into_bytes();
    if method != "HEAD" {
        bytes.extend_from_slice(body.as_bytes());
    }
    bytes
}

fn known_id(id: &str) -> bool {
    KNOWN.iter().any(|known| known.id == id)
}

fn research_alias(id: &str) -> bool {
    id == "galion-research-pi5.service"
}

fn href_for(id: &str, state: &str) -> Option<String> {
    if state != STATE_UP {
        return None;
    }
    let port = match id {
        "openmind-desktop.service" => crate::DESKTOP_PORT,
        "galion-research.service" => crate::RESEARCH_PORT,
        _ => return None,
    };
    Some(format!("http://127.0.0.1:{port}/"))
}

fn prefer<'a>(primary: (&'a str, &'a str), other: (&'a str, &'a str)) -> (&'a str, &'a str) {
    if rank(other.0) > rank(primary.0) {
        other
    } else {
        primary
    }
}

fn rank(state: &str) -> u8 {
    match state {
        STATE_UP => 6,
        STATE_COMING => 5,
        STATE_FINISHED => 4,
        STATE_DOWN => 3,
        STATE_UNREAD => 2,
        _ => 1,
    }
}

fn listed_state(
    units: Option<&Vec<Live>>,
    files: Option<&Vec<String>>,
    id: &str,
) -> (&'static str, &'static str) {
    let Some(units) = units else {
        return (STATE_UNREAD, "unread");
    };
    if let Some(live) = units.iter().find(|live| live.id == id) {
        if live.load == "not-found" {
            return (STATE_ABSENT, "absent");
        }
        return classify(&live.active, &live.sub);
    }
    match files {
        Some(files) if files.iter().any(|file| file == id) => (STATE_DOWN, "down"),
        Some(_) => (STATE_ABSENT, "absent"),
        None => (STATE_DOWN, "down"),
    }
}

fn desktop_state(show: Option<&Vec<Live>>, id: &str) -> (&'static str, &'static str) {
    let Some(rows) = show else {
        return (STATE_UNREAD, "unread");
    };
    match rows.iter().find(|live| live.id == id) {
        Some(live) if live.load == "not-found" || live.load.is_empty() => (STATE_ABSENT, "absent"),
        Some(live) => classify(&live.active, &live.sub),
        None => (STATE_UNREAD, "unread"),
    }
}

fn classify(active: &str, sub: &str) -> (&'static str, &'static str) {
    match (active, sub) {
        ("active", "exited") => (STATE_FINISHED, "finished"),
        ("active", _) => (STATE_UP, "up"),
        ("activating" | "reloading", _) => (STATE_COMING, "coming"),
        _ => (STATE_DOWN, "down"),
    }
}

fn parse_list_units(text: &str) -> Vec<Live> {
    let mut rows = Vec::new();
    for line in text.lines() {
        let line = line.trim().trim_start_matches(['●', '*']).trim();
        if line.is_empty() {
            continue;
        }
        let mut parts = line.split_whitespace();
        let Some(id) = parts.next() else { continue };
        let Some(load) = parts.next() else { continue };
        let Some(active) = parts.next() else { continue };
        let Some(sub) = parts.next() else { continue };
        if !is_galion_unit(id) {
            continue;
        }
        rows.push(Live {
            id: id.to_string(),
            load: load.to_string(),
            active: active.to_string(),
            sub: sub.to_string(),
        });
    }
    rows
}

fn parse_list_files(text: &str) -> Vec<String> {
    let mut ids = Vec::new();
    for line in text.lines() {
        let line = line.trim().trim_start_matches(['●', '*']).trim();
        if line.is_empty() {
            continue;
        }
        let Some(id) = line.split_whitespace().next() else {
            continue;
        };
        if is_galion_unit(id) {
            ids.push(id.to_string());
        }
    }
    ids
}

fn parse_show(text: &str) -> Vec<Live> {
    let mut rows = Vec::new();
    for block in text.split("\n\n") {
        let mut id = String::new();
        let mut load = String::new();
        let mut active = String::new();
        let mut sub = String::new();
        for line in block.lines() {
            let line = line.trim();
            if let Some(value) = line.strip_prefix("Id=") {
                id = value.to_string();
            } else if let Some(value) = line.strip_prefix("LoadState=") {
                load = value.to_string();
            } else if let Some(value) = line.strip_prefix("ActiveState=") {
                active = value.to_string();
            } else if let Some(value) = line.strip_prefix("SubState=") {
                sub = value.to_string();
            }
        }
        if id.is_empty() {
            continue;
        }
        rows.push(Live {
            id,
            load,
            active,
            sub,
        });
    }
    rows
}

fn is_galion_unit(id: &str) -> bool {
    const SUFFIXES: &[&str] = &[
        ".service", ".target", ".socket", ".timer", ".path", ".mount", ".slice",
    ];
    id.starts_with("galion-")
        && id.len() > "galion-".len()
        && SUFFIXES.iter().any(|suffix| id.ends_with(suffix))
}

fn request_target(request: &str) -> (&str, &str) {
    let Some(line) = request.lines().next() else {
        return ("", "/");
    };
    let mut parts = line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let raw = parts.next().unwrap_or("/");
    let path = raw.split('?').next().unwrap_or("/");
    (method, path)
}

fn document(lede: &str, body: &str, services: bool) -> String {
    let skip = if services {
        "<a class=\"skip\" href=\"#services\">Skip to services</a>"
    } else {
        ""
    };
    let note = if services {
        "<p class=\"note\">Finished means the unit did its work and exited. A linked name is open on this machine. Reload the page to read the machine again. In development. This page stays on this machine.</p>"
    } else {
        ""
    };
    format!(
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><meta name=\"color-scheme\" content=\"dark light\"><meta name=\"theme-color\" content=\"#05070A\" media=\"(prefers-color-scheme: dark)\"><meta name=\"theme-color\" content=\"#F7F9FB\" media=\"(prefers-color-scheme: light)\"><title>Galion OS</title><style>{tokens}{css}</style></head><body>{skip}<main><p class=\"kicker\">Galion OS</p><div class=\"presence\" aria-hidden=\"true\"></div><h1>Welcome.</h1><p class=\"lede\">{lede}</p><hr class=\"rule\">{body}{note}</main></body></html>",
        tokens = TOKENS_CSS,
        css = PAGE_CSS,
        lede = escape(lede),
    )
}

fn escape(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for ch in text.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            _ => out.push(ch),
        }
    }
    out
}

const PAGE_CSS: &str = r"
* { box-sizing: border-box; }
html { scroll-padding-top: var(--om-space-6); }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--om-bg-deep);
  color: var(--om-fg);
  font-family: var(--om-font-sans);
  font-size: var(--om-size-body);
  line-height: var(--om-leading);
}
main {
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--om-space-6) var(--om-space-4) var(--om-space-5);
}
.kicker {
  margin: 0 0 var(--om-space-4);
  color: var(--om-fg-muted);
  font-family: var(--om-font-mono);
  font-size: var(--om-size-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.presence {
  width: var(--om-space-6);
  height: var(--om-space-6);
  margin: 0 0 var(--om-space-3);
  border-radius: var(--om-radius-pill);
  background: var(--om-fg);
  animation: breath 7s ease-in-out infinite;
}
h1, h2 {
  font-family: var(--om-font-display);
  font-weight: 500;
  letter-spacing: -0.02em;
}
h1 { margin: 0; font-size: var(--om-space-6); line-height: 1.15; }
.lede { margin: var(--om-space-3) 0 0; max-width: 36ch; }
.rule {
  height: 1px;
  margin: var(--om-space-5) 0 var(--om-space-4);
  border: 0;
  background: var(--om-border);
}
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--om-space-2); }
li {
  display: grid;
  grid-template-columns: 1.4rem 1fr auto;
  gap: var(--om-space-3);
  align-items: center;
  margin: 0;
  padding: var(--om-space-3) var(--om-space-4);
  background: var(--om-panel);
  border: 1px solid var(--om-border);
  border-radius: var(--om-radius-md);
}
h2 { margin: 0; font-size: var(--om-size-title); line-height: 1.2; }
li p { margin: 0.2rem 0 0; color: var(--om-fg-muted); font-size: var(--om-size-meta); }
.state {
  margin: 0;
  font-family: var(--om-font-mono);
  font-size: var(--om-size-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
li.up .state { color: var(--om-accent); }
li.finished .state, li.coming .state { color: var(--om-slate); }
li.down .state, li.absent .state, li.unread .state { color: var(--om-fg-muted); }
.mark {
  width: var(--om-space-2);
  height: var(--om-space-2);
  border-radius: var(--om-radius-pill);
  background: var(--om-fg);
}
.mark.finished, .mark.coming { background: var(--om-slate); }
.mark.down, .mark.absent, .mark.unread {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--om-border);
}
.mark.up { background: var(--om-accent); }
.note, .back {
  margin: var(--om-space-5) 0 0;
  color: var(--om-fg-muted);
  font-size: var(--om-size-meta);
  max-width: 42ch;
}
a { color: var(--om-accent); }
.skip {
  position: absolute;
  left: var(--om-space-3);
  top: -48px;
  background: var(--om-accent);
  color: var(--om-accent-fg);
  padding: var(--om-space-2) var(--om-space-3);
  border-radius: var(--om-radius-sm);
}
.skip:focus { top: var(--om-space-3); }
:focus-visible { outline: 2px solid var(--om-focus); outline-offset: 3px; }
@keyframes breath {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.96); opacity: 0.88; }
}
@media (max-width: 560px) {
  li { grid-template-columns: 1.4rem 1fr; }
  .state { grid-column: 2; margin-top: var(--om-space-2); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .presence { transform: none; }
}
";

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;

    fn seed_snapshot() -> UnitSnapshot {
        UnitSnapshot {
            list_units: Some(
                "\
galion-os.target loaded active active Galion OS
galion-init.service loaded active exited Galion OS init plan
galion-welcome.service loaded active running Galion OS welcome
"
                .to_string(),
            ),
            list_files: Some(
                "\
galion-os.target enabled enabled
galion-init.service enabled enabled
galion-welcome.service enabled enabled
"
                .to_string(),
            ),
            desktop_show: Some(
                "\
Id=openmind-desktop.service
LoadState=not-found
ActiveState=inactive
SubState=dead
"
                .to_string(),
            ),
        }
    }

    #[test]
    fn fresh_seed_names_each_service_once() {
        let rows = rows_from_snapshot(&seed_snapshot());
        let states: Vec<_> = rows
            .iter()
            .map(|row| (row.name.as_str(), row.state))
            .collect();
        assert_eq!(
            states,
            vec![
                ("Galion OS", STATE_UP),
                ("Init", STATE_FINISHED),
                ("Welcome", STATE_UP),
                ("Open Mind", STATE_ABSENT),
                ("Research", STATE_ABSENT),
                ("Voice", STATE_ABSENT),
            ]
        );
    }

    #[test]
    fn unread_when_systemd_cannot_be_read() {
        let rows = rows_from_snapshot(&UnitSnapshot::default());
        assert!(rows.iter().all(|row| row.state == STATE_UNREAD));
        assert_eq!(rows.len(), KNOWN.len());
    }

    #[test]
    fn research_up_and_extra_unit_kept() {
        let mut snapshot = seed_snapshot();
        snapshot.list_units = Some(
            "\
galion-os.target loaded active active Galion OS
galion-init.service loaded activating start Galion OS init plan
galion-welcome.service loaded inactive dead Galion OS welcome
galion-research.service loaded active running Galion Research
galion-<b>.service loaded active running nasty
"
            .to_string(),
        );
        snapshot.list_files = Some(
            "\
galion-os.target static
galion-init.service enabled
galion-welcome.service enabled
galion-research.service enabled
galion-<b>.service disabled
galion-voiced.service disabled
"
            .to_string(),
        );
        let rows = rows_from_snapshot(&snapshot);
        assert_eq!(rows[1].state, STATE_COMING);
        assert_eq!(rows[2].state, STATE_DOWN);
        assert_eq!(rows[4].name, "Research");
        assert_eq!(rows[4].state, STATE_UP);
        assert_eq!(rows[5].state, STATE_DOWN);
        let page = render_page(&rows);
        assert!(page.contains("galion-&lt;b&gt;.service"));
        assert!(!page.contains("<b>"));
        assert!(page.contains("href=\"http://127.0.0.1:8787/\""));
        assert!(page.contains("<h2><a href=\"http://127.0.0.1:8787/\">Research</a></h2>"));
        assert!(!page.contains("18181"));
        assert!(!page.contains("https://"));
        assert!(!page.to_ascii_lowercase().contains("<script"));
    }

    #[test]
    fn fresh_seed_has_no_loopback_link_and_uses_open_mind_tokens() {
        let page = render_page(&rows_from_snapshot(&seed_snapshot()));
        assert!(!page.contains("http://"));
        assert!(!page.contains("https://"));
        assert!(!page.contains("127.0.0.1"));
        assert!(page.contains("--om-ink"));
        assert!(page.contains("#0B0F14"));
        assert!(page.contains("#58C4FF"));
        assert!(page.contains("\"Jost\""));
        assert!(page.contains("--om-space-4"));
        assert!(!page.to_ascii_lowercase().contains("#f5a524"));
        assert!(!page.to_ascii_lowercase().contains("#7c3aed"));
        assert!(rows_from_snapshot(&seed_snapshot())
            .iter()
            .all(|row| row.href.is_none()));
    }

    #[test]
    fn links_research_and_the_desktop_only_while_up() {
        let mut snapshot = seed_snapshot();
        snapshot.list_units = Some(
            "\
galion-os.target loaded active active Galion OS
galion-init.service loaded active exited Galion OS init plan
galion-welcome.service loaded active running Galion OS welcome
galion-research.service loaded active running Galion Research
galion-voiced.service loaded activating start Galion Voice
"
            .to_string(),
        );
        snapshot.desktop_show = Some(
            "\
Id=openmind-desktop.service
LoadState=loaded
ActiveState=active
SubState=running
"
            .to_string(),
        );
        let rows = rows_from_snapshot(&snapshot);
        let research = rows.iter().find(|row| row.name == "Research").unwrap();
        let desktop = rows.iter().find(|row| row.name == "Open Mind").unwrap();
        let voice = rows.iter().find(|row| row.name == "Voice").unwrap();
        assert_eq!(research.href.as_deref(), Some("http://127.0.0.1:8787/"));
        assert_eq!(desktop.href.as_deref(), Some("http://127.0.0.1:18181/"));
        assert_eq!(voice.state, STATE_COMING);
        assert!(voice.href.is_none());
        let page = render_page(&rows);
        assert!(page.contains("href=\"http://127.0.0.1:8787/\""));
        assert!(page.contains("href=\"http://127.0.0.1:18181/\""));
        assert!(!page.contains("galion-voiced"));
    }

    #[test]
    fn pi5_research_unit_links_once() {
        let mut snapshot = seed_snapshot();
        snapshot.list_units = Some(
            "\
galion-os.target loaded active active Galion OS
galion-init.service loaded active exited Galion OS init plan
galion-welcome.service loaded active running Galion OS welcome
galion-research-pi5.service loaded active running Galion Research
"
            .to_string(),
        );
        let rows = rows_from_snapshot(&snapshot);
        let research: Vec<_> = rows.iter().filter(|row| row.name == "Research").collect();
        assert_eq!(research.len(), 1);
        assert_eq!(research[0].state, STATE_UP);
        assert_eq!(research[0].href.as_deref(), Some("http://127.0.0.1:8787/"));
        assert!(!rows.iter().any(|row| row.name.contains("pi5")));
    }

    #[test]
    fn page_answers_get_head_and_refuses_the_rest() {
        let rows = rows_from_snapshot(&seed_snapshot());
        let ok = answer("GET / HTTP/1.1\r\nHost: localhost\r\n\r\n", &rows);
        let text = String::from_utf8(ok).unwrap();
        assert!(text.starts_with("HTTP/1.1 200 OK\r\n"));
        assert!(text.contains("Content-Security-Policy: default-src 'none'"));
        assert!(text.contains("<h2>Open Mind</h2>"));
        assert!(text.contains("Not on this machine"));
        let head = answer("HEAD / HTTP/1.1\r\n\r\n", &rows);
        let head_text = String::from_utf8(head).unwrap();
        assert!(head_text.starts_with("HTTP/1.1 200 OK\r\n"));
        assert!(head_text.ends_with("\r\n\r\n"));
        assert!(!head_text.contains("<html"));
        let missing = String::from_utf8(answer("GET /other HTTP/1.1\r\n\r\n", &rows)).unwrap();
        assert!(missing.contains("HTTP/1.1 404 Not Found\r\n"));
        assert!(missing.contains("This machine has one page."));
        let denied = String::from_utf8(answer("POST / HTTP/1.1\r\n\r\n", &rows)).unwrap();
        assert!(denied.contains("HTTP/1.1 405 Method Not Allowed\r\n"));
        assert!(denied.contains("Allow: GET, HEAD\r\n"));
    }

    #[test]
    fn default_port_matches_the_unit_file() {
        let unit = include_str!("../../packaging/pi5/galion-welcome.service");
        let target = include_str!("../../packaging/pi5/galion-os.target");
        assert!(unit.contains(&WELCOME_PORT.to_string()));
        assert!(unit.contains("ExecStart=/opt/galion/bin/galion-welcome"));
        assert!(!unit.lines().any(|line| {
            let line = line.trim_start();
            line.starts_with("PrivateNetwork")
        }));
        assert!(target.contains("galion-welcome.service"));
        assert_eq!(WELCOME_PORT, 18711);
    }
}
