# `/dev/fb0` one-dot surface

*Maciej Grajczyk · 2026-11-02 (Europe/Zagreb, CET, UTC+1). Sector 06-RENDER, W3-06c. Status: **SPEC**. The surface is not implemented in this tree.*

Galion OS Voice is the first image profile: voice-first, with Hermes off-device on the side band, outside the 80 ms audio path. Its panel contract is one dot. This file is the contract for drawing that dot on the Linux framebuffer. The root README stays with the open profiles change; this document is the spec that change points at.

Local render evidence this spec builds on: the one-dot surface already exists for the terminal, for web `/dot` (loopback only), for null, and for an offscreen raster. G4 for that render path is blessed (p99 ≈ 10.7 µs). Palette tokens are the `#F5F5F7` dot and an obsidian / amber / violet ground. `DotState` is `Idle`, `Listening`, or `Speaking`, a pure function of the heartbeat. `TerminalDotSurface` leaks no text. `NullSurface::last_dot` is the headless observation. The framebuffer writer is the open piece.

## 1. Profile contract

On a Galion OS Voice image the only pixels are this surface.

| Rule | Requirement |
|---|---|
| Device | `/dev/fb0` exactly. One framebuffer, one writer. |
| Display server | The image ships no X11, Wayland, or compositor. |
| Picture | One disc, centred, colour `#F5F5F7`, on the obsidian / amber / violet ground. |
| Words | The panel shows no glyphs: no console, no transcript, no captions, no clock, no menu. |
| Hermes | Off-device, on the side band. The framebuffer writer has no side-band client. |
| Audio | `present` is off the 80 ms audio path and off `Heartbeat::step`. |
| Missing panel | Voice still comes up. A missing `/dev/fb0` is a normal boot, same as `NullSurface`. |
| Shared base | `galion-init` and the Obsidian Open Mind contract, in common with the later Hermes GUI profile. |

Galion Voice also runs on plain Linux. This surface is the image-profile pixel path. The voice runtime stays valid with every surface absent.

The later Hermes GUI profile (one window, one prompt field) is a different surface. Its window backend is a separate policy call and is not this file.

## 2. Where it sits

`Fb0DotSurface` implements the same observation the other one-dot surfaces already implement: accept a `DotState`, and expose `last_dot` for tests.

```text
heartbeat  -->  DotState  -->  TerminalDotSurface
                           -->  web /dot  (loopback)
                           -->  NullSurface
                           -->  offscreen raster   (G4)
                           -->  Fb0DotSurface      (this spec)
```

`DotState` stays a pure function of the heartbeat, computed once and shared. The open wire from `galion-heartbeat` `FrameOut` into that function lands in one place, upstream of every surface, so the framebuffer cannot grow its own mapping. Today the dot follows viz frames; this writer accepts whatever `DotState` those frames already produce.

`Fb0DotSurface` reads no microphone, no affect store, and no model resource. It packs pixels.

## 3. Allowed device operations

Closed set. Anything not listed here is outside the surface.

**`/dev/fb0`**

1. `open("/dev/fb0", O_RDWR | O_CLOEXEC)`.
2. `flock(fd, LOCK_EX | LOCK_NB)`. If the lock is held, take the null path (section 7).
3. `FBIOGET_FSCREENINFO`.
4. `FBIOGET_VSCREENINFO`.
5. `mmap` of `smem_len` bytes at offset 0, `PROT_READ | PROT_WRITE`, `MAP_SHARED`.
6. Stores into that mapping, bounds-checked (section 5).
7. On drop: `munmap`, `close`. The lock goes with the fd.

**Virtual terminal, only when one is present**

8. If a VT is bound to this framebuffer, `KDSETMODE` / `KD_GRAPHICS` on that VT so fbcon stops painting glyphs over the dot.
9. On drop, `KDSETMODE` / `KD_TEXT` only if this process issued step 8.

Opening the VT is optional. Embedded panels often have `/dev/fb0` and no VT. Failure to open `/dev/tty0` keeps the pixel path.

The image grants the voice render user group `video` on `/dev/fb0`. The writer is not setuid and does not need to run as root.

The process does not read `$FRAMEBUFFER`. A leftover value must not retarget the dot onto another node or a file. The process does not open `/dev/dri`, a second `/dev/fbN`, or an input device.

## 4. Mode the writer will accept

Read-only screen info. The writer leaves the mode the bootloader and the kernel already set.

Accept the device when all of the following hold:

| Field | Accept |
|---|---|
| `fix.type` | `FB_TYPE_PACKED_PIXELS` |
| `fix.visual` | `FB_VISUAL_TRUECOLOR` |
| `fix.line_length` | Greater than or equal to the visible stride, and non-zero |
| `var.bits_per_pixel` | 16 or 32, and divisible by 8 |
| `var.xres`, `var.yres` | Both non-zero, and the visible window fits in `smem_len` |
| `var.red/green/blue` | `length` > 0, `msb_right` == 0 |
| `var.grayscale` | 0 |

`line_length` is the stride. The writer never assumes `xres * bytes_per_pixel`.

Visible pixel `(x, y)` is stored at:

```text
byte = (x + var.xoffset) * (var.bits_per_pixel / 8)
     + (y + var.yoffset) * fix.line_length
```

A store is legal when `byte + bytes_per_pixel <= fix.smem_len`. The mapping length is `smem_len` from the kernel. `mmio_start` / `mmio_len` are registers; the writer never maps them.

16-bit panels are RGB565-class truecolor as described by the bitfields. 32-bit panels place channels at the reported offsets (the packer does not assume BGRA). When `transp.length` > 0, that field is written all-ones so the pixel is opaque. Source coverage below 1 blends the dot token with the ground in 8-bit channels, then rounds to the bitfield width, ties to even.

Any other geometry, visual, or depth takes the null path. In particular the writer leaves text-mode, pseudocolor, directcolor, 8-bit, and 24-bit framebuffers untouched. It does not program a colormap and it does not call `FBIOPUT_VSCREENINFO`.

## 5. What is drawn

One centred disc. The coverage function, the radius, and the ground motion are the ones the offscreen rasteriser already uses and G4 already blesses. This surface does not define a second look.

| `DotState` | Ground | Disc |
|---|---|---|
| `Idle` | Obsidian token. Amber and violet stay at rest. | `#F5F5F7` |
| `Listening` | Obsidian, amber allowed in the ground. | `#F5F5F7` |
| `Speaking` | Obsidian, violet allowed in the ground. | `#F5F5F7` |

Palette is those tokens only. Edge coverage may blend `#F5F5F7` with the current ground. No other channel value is written. There is no second sprite, no ring, no meter, and no glyph atlas.

The disc centre is the centre of the visible window (`xres / 2`, `yres / 2`), then offset by `xoffset` / `yoffset`. The writer does not rotate the panel and does not set a mode to make it square.

Ground motion, when the shared rasteriser asks for it, is a function of `DotState` and the render tick. It is not a function of microphone amplitude.

Presentation:

- Init may fill the visible window with the obsidian ground. That fill is setup, not the tick.
- Each `present` rewrites the dirty rectangle: the union of the previous disc bounds and the new disc bounds, plus any ground texels the shared rasteriser marked dirty. A repeated `DotState` with an empty dirty rect performs no stores.
- A late present holds the frame already on the panel. The writer does not burst a backlog of frames.
- Tear of a single soft disc is acceptable. The writer does not page-flip, does not call `FBIOPAN_DISPLAY`, and does not call `FBIO_WAITFORVSYNC`.
- The writer does not call `msync` with `MS_SYNC`.

On drop the visible window is filled with the obsidian ground, then the mapping is released and step 9 of section 3 runs. The panel is left quiet. `galion-init` drops the surface on the way down. The writer installs no signal handlers of its own.

## 6. Time, threads, allocation

`Heartbeat::step` stays non-blocking and zero-alloc on its own path. `Fb0DotSurface::present` is a separate call on a render thread.

| Phase | Allocation | Blocking |
|---|---|---|
| Construct: open, lock, ioctl, mmap, first ground fill | Allowed | Allowed. Failure takes the null path. |
| `present(DotState)` | None. Scratch for the dirty rect is reserved at init. | No syscall that waits on the panel. Stores into the mapping only. |
| Drop | None required | `munmap`, unlock-on-close, VT restore. |

`present` is called from one thread. The audio thread does not call it. A framebuffer stall must not stretch the 80 ms audio path: the render thread holds the last frame and returns.

G4 (p99 ≈ 10.7 µs) remains the golden for the terminal, null, and offscreen path. Framebuffer store latency is a different measurement and must not be written back into that golden. The framebuffer gate is the one in section 8.

## 7. Failure

Every failure below is the null path: voice stays up, `last_dot` still updates so tests can see the state, the fd is not held, and `galion-init` does not treat it as a fatal.

- `/dev/fb0` absent, or not writable by the render user.
- `flock` returns `EWOULDBLOCK` (another writer already holds the panel).
- `FBIOGET_FSCREENINFO` or `FBIOGET_VSCREENINFO` fails.
- The mode check in section 4 rejects the device.
- `smem_len` is too small for the visible window, or `mmap` fails.

A rejected device is left exactly as it was found: no mode set, no partial mmap kept alive, no VT left in `KD_GRAPHICS` unless a later successful surface is the one that set it.

## 8. Acceptance

This repository has no render crate yet. When the writer lands, these are the gates. They run without a live panel and without a VPS.

1. **Packer fixtures.** Synthetic `fb_fix_screeninfo` / `fb_var_screeninfo` for 32-bit truecolor (offsets 0/8/16 and the swapped 16/8/0 layout) and for 16-bit RGB565. `line_length` is strictly wider than the visible stride. Non-zero `xoffset` and `yoffset`. Expected bytes are golden.
2. **Bounds.** A fixture whose `smem_len` ends inside the visible window takes the null path and writes nothing.
3. **Reject.** Text visual, pseudocolor, 8-bit, 24-bit, `msb_right != 0`, and `grayscale != 0` take the null path.
4. **One disc, no glyphs.** For each `DotState`, every pixel is either the ground token, the dot token `#F5F5F7`, or a coverage blend of those two. A glyph-shaped probe pattern is absent.
5. **Same `DotState` as the siblings.** A scripted heartbeat trace produces the same `last_dot` sequence on null, terminal, offscreen, and the fb stand-in.
6. **Hold.** Two identical `present` calls produce one write. A late second state, delivered as a pair, results in the latest state only, with no catch-up burst.
7. **Zero-alloc tick.** The allocation counter across `present` stays at the construct-time high water mark.
8. **Drop.** After drop the stand-in buffer is the obsidian ground, the fd is closed, and a VT that was switched is back in `KD_TEXT`.
9. **G4 untouched.** The existing render golden still passes on its own budget.

Headless CI uses the stand-in. A hardware `/dev/fb0` run is optional and is not a merge gate.

## 9. Out of scope

- Implementing `Fb0DotSurface` in this change.
- Wiring `FrameOut` from `galion-heartbeat` into `DotState` (upstream of every surface, its own change).
- The optional window backend (softbuffer / winit) and any new dependency it would add.
- Serving pixels. Web `/dot` stays loopback-only and is a different surface.
- Editing the root README.
- Model resources, image builds, and any VPS or R0–R3 run.

## 10. Source notes

Sector snapshot this spec is written against: one-dot terminal, loopback `/dot`, null, and offscreen raster done; G4 blessed; `/dev/fb0` explicitly still spec-only; dot still driven by viz frames until `FrameOut` is wired. Profile wording for "at most one dot on `/dev/fb0`" lives in the open README profiles change and is not modified here.

— Maciej Grajczyk
