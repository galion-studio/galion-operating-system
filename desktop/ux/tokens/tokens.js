/* Generated from tokens.json by export.py. Do not edit. */
window.GALION_TOKENS = {
  "name": "Galion OS",
  "maker": "Galion Labs",
  "license": "MIT",
  "copyright": "Copyright (c) 2026 Galion Labs",
  "color": {
    "voice": {
      "obsidian": "#0A0A0C",
      "panel": "#141418",
      "hairline": "#2C2C33",
      "dot": "#F5F5F7",
      "amber": "#F5A524",
      "violet": "#7C3AED",
      "heather": "#B695CF",
      "mist": "#A7B6C4",
      "text": "#F5F5F7"
    },
    "openMind": {
      "obsidian": "#05070A",
      "ink": "#0B0F14",
      "surface": "#131A22",
      "glass": "#1B2633",
      "line": "#24303C",
      "slate": "#4A7C99",
      "mist": "#A7B6C4",
      "text": "#E6EDF3",
      "sky": "#58C4FF",
      "ice": "#B8E8FF",
      "ocean": "#0B5FA5",
      "paper": "#F7F9FB",
      "mutedPaper": "#3F4C59",
      "panelLight": "#EEF2F6",
      "lineLight": "#D5DDE5",
      "onAccent": "#FFFFFF"
    }
  },
  "type": {
    "display": {
      "family": "Jost",
      "weight": 500,
      "stack": "\"Jost\", \"IBM Plex Sans\", system-ui, sans-serif"
    },
    "sans": {
      "family": "IBM Plex Sans",
      "weights": [
        400,
        500,
        600
      ],
      "stack": "\"IBM Plex Sans\", system-ui, sans-serif"
    },
    "mono": {
      "family": "IBM Plex Mono",
      "weights": [
        400,
        500
      ],
      "stack": "\"IBM Plex Mono\", ui-monospace, monospace"
    },
    "scale": {
      "label": 12,
      "meta": 13,
      "body": 16,
      "title": 18,
      "heading": 21.6,
      "displayMin": 40,
      "displayMax": 70.4
    },
    "leading": {
      "ui": 1.45,
      "prose": 1.65
    },
    "tracking": {
      "display": "-0.02em",
      "byline": "0.16em"
    }
  },
  "space": {
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 24,
    "6": 32
  },
  "radius": {
    "sm": 6,
    "md": 11,
    "card": 18,
    "pill": 999,
    "iconPx": 10,
    "iconBox": 44,
    "icon": "22.727%"
  },
  "motion": {
    "wake": {
      "name": "om-rise",
      "ms": 160,
      "easing": "ease",
      "from": "opacity 0; translateY(4px)",
      "to": "opacity 1; transform none",
      "source": "desktop/boot/animations/om-rise.css"
    },
    "color": {
      "ms": 160,
      "easing": "ease",
      "source": "desktop/boot/animations/om-rise.css"
    },
    "breath": {
      "ms": 3200,
      "easing": "ease-in-out",
      "source": "site/assets/site.css"
    },
    "pulse": {
      "ms": 1618,
      "css": "1.618s",
      "easing": "cubic-bezier(.23,1,.32,1)",
      "source": "desktop/boot/animations/status-pulse.css"
    }
  },
  "sound": {
    "referenceHz": 432,
    "sampleRate": 16000,
    "amplitude": 0.32,
    "fadeMs": 8,
    "envelope": "0.5 - 0.5 * cos(pi * x)",
    "wakePath": "desktop/boot/sounds/openmind-desktop-sound.rs",
    "hook": "WAKE_TONE_PATH",
    "sessionTone": "wake",
    "tones": [
      {
        "id": "wake",
        "role": "The console is ready",
        "num": 1,
        "den": 1,
        "ms": 160
      },
      {
        "id": "ask",
        "role": "Voice armed, or a question",
        "num": 5,
        "den": 4,
        "ms": 120
      },
      {
        "id": "hear",
        "role": "A file was picked for upload",
        "num": 9,
        "den": 8,
        "ms": 100
      },
      {
        "id": "notice",
        "role": "The stack wants a look",
        "num": 4,
        "den": 3,
        "ms": 140
      },
      {
        "id": "done",
        "role": "A command was kept on the page",
        "num": 3,
        "den": 2,
        "ms": 160
      },
      {
        "id": "deny",
        "role": "Refused. Nothing was sent",
        "num": 3,
        "den": 4,
        "ms": 180
      },
      {
        "id": "close",
        "role": "Voice disarmed",
        "num": 2,
        "den": 3,
        "ms": 140
      }
    ],
    "os": {
      "source": "desktop/boot/sounds/os-tones.js",
      "fundamentalHz": 432,
      "hum": [
        108,
        216
      ],
      "notes": {
        "boot": [
          108,
          216,
          432
        ],
        "shutdown": [
          432,
          216,
          108
        ],
        "notification": [
          432,
          540
        ],
        "wake": [
          216,
          432,
          648
        ],
        "done": [
          540,
          648,
          864
        ],
        "approval": [
          432,
          648
        ],
        "error": [
          216,
          108
        ]
      }
    },
    "bells": {
      "source": "desktop/boot/sounds/console-ui-sound.rs",
      "ids": [
        "open",
        "close",
        "minimise",
        "settle"
      ]
    }
  },
  "session": {
    "desktop": "http://127.0.0.1:18181/",
    "one": "http://127.0.0.1:18181/one",
    "research": "http://127.0.0.1:8787/",
    "wakeTonePath": "desktop/boot/sounds/openmind-desktop-sound.rs",
    "wakeAnimationPath": "desktop/boot/animations/om-rise.css"
  }
};
