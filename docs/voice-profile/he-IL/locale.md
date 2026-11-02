# Locale `he-IL`

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1).*

Locale and clock for the Hebrew / Israel layer of Galion OS Voice. The voice-first picture is unchanged: no display server, at most one `#F5F5F7` dot on `/dev/fb0`, Hermes off-device on the side band and never on the 80 ms path. The dot carries no glyphs. Everything below is for speech, for logs, and for any future terminal or console chrome.

The profile clock is civil time in `Asia/Jerusalem`. It is not the Hebrew calendar.

## Identity

| | |
|---|---|
| Locale | `he-IL` |
| Language | Hebrew (`he`) |
| Region | Israel (`IL`) |
| Timezone | `Asia/Jerusalem` (IANA) |
| Default direction | Right to left for Hebrew runs |
| Shared base | `galion-init`, Obsidian Open Mind contract |

Store the zone name `Asia/Jerusalem`. Do not bake a fixed offset. Israel Standard Time is UTC+2, and Israel Daylight Time is UTC+3. The transitions live in the zone database and move when the civil rules move. A log line that needs to be absolute carries the offset of that instant, for example `2026-11-02T09:30:00+02:00`.

The 80 ms frame stays a duration. It is not local time, and it does not consult the zone.

## Dates and times

The week in Israel starts on Sunday.

| Use | Form | Example |
|---|---|---|
| Logs, manifests, machine exchange | ISO 8601, Gregorian, offset or `Z` when the instant is UTC | `2026-11-02T09:30:00+02:00` |
| Numeric chrome | `dd.MM.yyyy` | `02.11.2026` |
| Long chrome | day, Hebrew month name, year | 2 בנובמבר 2026 |
| Clock in chrome and logs | 24-hour `HH:mm`, or `HH:mm:ss` when seconds matter | `18:30` |
| Spoken civil date | day, Hebrew month name, year, in a calm short phrase | "השני בנובמבר" |
| Spoken clock | 24-hour unless the owner picks another spoken form | "שמונה־עשרה ושלושים" |

Digits in numeric chrome and in logs are European digits (`0`–`9`). Hebrew letter-numbers are not the default form. The profile clock is the Gregorian civil date in `Asia/Jerusalem`. The Hebrew calendar is not that clock, not the log format, and not an input to boot or to the audio path.

Month names for the long form, Gregorian, in Hebrew:

| | | | |
|---|---|---|---|
| 1 ינואר | 2 פברואר | 3 מרץ | 4 אפריל |
| 5 מאי | 6 יוני | 7 יולי | 8 אוגוסט |
| 9 ספטמבר | 10 אוקטובר | 11 נובמבר | 12 דצמבר |

Day-of-week names, Sunday first: יום ראשון, יום שני, יום שלישי, יום רביעי, יום חמישי, יום שישי, שבת.

Owner-facing quiet hours, including the optional Friday evening / Shabbat mute in [README.md](README.md), are interpreted in `Asia/Jerusalem`. Default for that mute is off.

## Right to left

These notes are for a future terminal or console chrome. The voice-first panel does not use them: `/dev/fb0` shows one dot and no text, and the dot is not mirrored when the locale is `he-IL`.

- Set the base direction on each Hebrew paragraph. A line that starts with a path, a colour, or a digit must not inherit its direction from that first character.
- Keep source strings in logical order. The renderer applies the Unicode Bidirectional Algorithm. Do not reverse Hebrew in the file, and do not pre-shape glyphs.
- Wrap embedded left-to-right runs — paths such as `/dev/fb0`, crate names such as `galion-init`, hex colours such as `#F5F5F7`, locale tags, and ISO timestamps — in bidi isolates (U+2066 … U+2069, or U+2068 … U+2069) so the Hebrew on either side stays in order.
- Align Hebrew labels to the right in that chrome. A Latin log line stays left to right. Direction is per run of text, not a single switch for the whole console.
- European digits inside a Hebrew sentence follow the bidi algorithm. Numeric dates stay `dd.MM.yyyy` in the numeric form, read as a left-to-right number.
- Modern UI Hebrew uses the common full stop and question mark. Place them with the bidi algorithm rather than by hand.
- The Linux text console is a weak RTL renderer. A future developer console that shows Hebrew needs a surface that can set base direction and isolates. Until that surface exists, Hebrew strings are for speech and for documents, and the panel stays the one dot.
- Do not mirror the framebuffer, the centred disc, or the audio path. Scrollbars and back-affordances, if a later window profile ever draws them, belong to that later profile.

Machine tokens (`idle`, `listening`, `speaking`, `he-IL`, `Asia/Jerusalem`) stay ASCII. The Hebrew labels in [README.md](README.md) are the draft display strings for those tokens.

## Optional holiday metadata

An Israel public-holiday list, if an owner attaches one, is metadata: civil dates, a name, nothing else. It does not mute, does not move `Asia/Jerusalem`, and is not read on the 80 ms path. Behaviour of Friday evening and Shabbat quiet hours is the separate owner preference in the profile README, default off.

— Maciej Grajczyk
