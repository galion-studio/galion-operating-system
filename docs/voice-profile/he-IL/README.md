# Galion OS Voice (עברית / Israel)

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1).*

This folder is the Hebrew / Israel-oriented layer of **Galion OS Voice**. It sits alongside the voice-first profile and the later Hermes GUI profile. The short English table in the root README stays as it is. These notes add locale, draft Hebrew strings, and owner preferences. They do not publish an image, a weight file, or a training run.

## Profile

| | |
|---|---|
| Name | Galion OS Voice (עברית / Israel) |
| Locale | `he-IL` |
| Timezone | `Asia/Jerusalem` |
| Place in the family | The voice-first image profile, with Hebrew / Israel preferences |
| Display | None. No X11, no Wayland, no compositor. At most one dot, `#F5F5F7`, on `/dev/fb0` |
| Hermes | Off-device, on the side band, never on the 80 ms path |
| Shared base | `galion-init`, Obsidian Open Mind contract |

The program is **Galion Voice**. It also runs on plain Linux, so this profile is not required to use it. The name Galion One belongs to a separate product.

Voice-first and the later Hermes GUI share one base. Hermes stays the centre for knowledge and tools in both. On this profile that centre is off the device. The later profile draws it as one window and one prompt field. Machine state tokens stay the English heartbeat names (`idle`, `listening`, `speaking`). Hebrew in this folder is the string layer for those tokens.

Details of dates, the zone, and right-to-left chrome are in [locale.md](locale.md). The same voice-first description in Hebrew is [voice-first.he.md](voice-first.he.md).

## Voice-first

The machine boots into the voice. The screen, when there is one, shows a single dot.

- There is no display server on this profile.
- The only user surface is at most one dot on `/dev/fb0`, colour `#F5F5F7`, solid for the whole frame.
- Hermes lives on the side band: knowledge, tools, and memory, reached from the host.
- Hermes is never on the 80 ms audio path. The voice loop owns turn-taking and speech. A late side-band answer is spoken as a late answer.

The dot rests, listens, and speaks. It is the voice made visible. It does not carry glyphs, so the Hebrew labels below are stubs for speech and for any future chrome, not pixels on the panel.

## Hebrew UI strings (DRAFT)

Draft stubs. They are not recorded audio, not a prompt list, and not a second state machine. An owner may replace every line.

| Token | English | Hebrew label (DRAFT) |
|---|---|---|
| `idle` | Idle | מנוחה |
| `listening` | Listening | הקשבה |
| `speaking` | Speaking | דיבור |

The labels name the state. They do not choose a voice gender. Spoken voice may later use a participle the owner picks (for example מקשיב / מדבר, or מקשיבה / מדברת). That choice is outside this draft.

### Spoken soft-acks (DRAFT)

Short, calm lines. This draft avoids gendered participles: "שמעתי" is first person, which does not mark gender, and "כן", "רגע", and "אני כאן" do not mark gender either. Each line is a draft example, not a shipped phrase.

- "כן."
- "רגע."
- "שמעתי."
- "אני כאן."

Tone for anything spoken in this profile: calm and respectful. Soft, short, and unhurried. The gentle sounds for starting, finishing, notices, and questions stay silent when the owner has muted them.

## Cultural notes

The default voice is calm and respectful in Hebrew as in English.

**Friday evening and Shabbat quiet hours** are an optional mute preference.

- Default: **off**.
- The owner turns it on and sets the start and the end, on the clock in `Asia/Jerusalem`.
- The profile does not compute candle-lighting or halakhic sunset, and it does not assume the household observes Shabbat.
- While the preference is on, the gentle sounds for starting, finishing, notices, and questions stay silent inside the window the owner set — the same sounds the product already holds silent at night or when muted.
- The preference is configuration. It stays off the 80 ms path, and it leaves `galion-init` and the Open Mind contract as they are.

**Israel's public-holiday calendar** is optional metadata only. A future list of civil dates may ride along as data the owner can read. It does not mute the voice, move the clock, change boot, or take part in the 80 ms path. It is not a scheduler.

## Privacy

This section is a reminder for owners. It is not legal advice, and it does not say which statute applies to a given household or deployment.

Galion OS is private by default: it runs on the owner's hardware, and the voice profile keeps Hermes off the device on the side band. Anything that leaves the machine is a side-band choice.

Owners who store or transmit personal data should consider, with their own counsel:

- **Israel.** The Protection of Privacy Law, 5741-1981 (חוק הגנת הפרטיות, התשמ״א–1981), and guidance from the Privacy Protection Authority (הרשות להגנת הפרטיות). Later amendments, including Amendment 13, changed duties around personal data. This page does not restate them.
- **European Union.** When the owner or the people in the conversation are in the EU or EEA, the General Data Protection Regulation (Regulation (EU) 2016/679) can apply as well as Israeli law. Which one applies, and how they meet, is a question for counsel.

Locale tags, timezone, and an optional holiday list are preferences. They are not a decision to collect data.

## What this folder leaves out

No Galion OS image, no Hermes binary, no weight file, and no training run are added here. Downloads stay on the root README once an image exists.

— Maciej Grajczyk
