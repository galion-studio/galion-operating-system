# Pull request #13 — merge readiness

*Packaging lane re-check. Git commands at 2026-11-15 15:36:09 +0100 (Europe/Zagreb). GitHub object read in the same pass.*

Re-run: `sh packaging/check-pr-13.sh`. That script exits 2 if asked to `--merge`. It does not merge #13.

The owner merges [#13](https://github.com/galion-studio/galion-operating-system/pull/13). This swarm does not.

## Checklist

- [x] `main` lacks `docs/PACKAGING.md`, `docs/PACKAGING-DECISIONS.md`, and `NOTICE`. The swarm-8 note on that branch is absent too. `main` at this reading: `170335b1d70478f4f6fa7a99f0410ae01243b707`.
- [x] #13 head `3adee77f86c3dfb8cd32f9070ad045f018e9b046` contains those three files plus `docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md`. `NOTICE` is the single line `The licence is LICENSE.`
- [x] #14's merge commit `bf222991d1c4f9f88f205cb621288d44211baa46` is an ancestor of the #13 branch and is not an ancestor of `main`.
- [x] #13 is still a draft. The pull request object in this pass: `state` open, `draft` true, `merged` false, base ref `main`, base sha `b9517e92815dd72196b435613ad9130abaa68336`, head `3adee77f86c3dfb8cd32f9070ad045f018e9b046`, `mergeable` true, `mergeable_state` clean. An agent does not mark it ready and does not merge it.
- [x] §10 headings `D1` through `D5` are present on that same head. The head SHA is unchanged from the plan's reading, so the decision text on that commit is the text already recorded in `docs/swarm-9/2026-11-15/os/PLAN.md`.
- [x] `LICENSE` on `main` still starts with the four G.A.L.I.O.N. lines and `Copyright (c) 2026 Galion Labs`.
- [x] The #13 diff against `b9517e92815dd72196b435613ad9130abaa68336` is four documentation files. No workflow, image, release, or price file.
- [x] `link-check` on `3adee77f86c3dfb8cd32f9070ad045f018e9b046` completed with conclusion `success`. Run: [43722765891](https://github.com/galion-studio/galion-operating-system/actions/runs/43722765891). The job does not scan Markdown.
- [ ] After the owner merges #13, `main` contains `NOTICE`, `docs/PACKAGING.md`, and `docs/PACKAGING-DECISIONS.md`. That is not true at this reading. This lane does not merge #13 to make it true.

## Command output

`sh packaging/check-pr-13.sh` exited 0:

```
pr-13 merge readiness
merge command: not run
main: 170335b1d70478f4f6fa7a99f0410ae01243b707
pr13: 3adee77f86c3dfb8cd32f9070ad045f018e9b046
pr13 head matches 3adee77f86c3dfb8cd32f9070ad045f018e9b046
absent on main: docs/PACKAGING.md
present on #13: docs/PACKAGING.md
absent on main: docs/PACKAGING-DECISIONS.md
present on #13: docs/PACKAGING-DECISIONS.md
absent on main: NOTICE
present on #13: NOTICE
absent on main: docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md
present on #13: docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md
NOTICE on #13: The licence is LICENSE.
bf222991d1c4f9f88f205cb621288d44211baa46 is on the #13 branch
bf222991d1c4f9f88f205cb621288d44211baa46 is not on main
files on #13 since b9517e92815dd72196b435613ad9130abaa68336:
  NOTICE
  docs/PACKAGING-DECISIONS.md
  docs/PACKAGING.md
  docs/swarm-8/2026-11-15/b1-os-packaging-decisions.md
#13 diff is the four documentation files. No workflow, image, or price file.
heading present: D1
heading present: D2
heading present: D3
heading present: D4
heading present: D5
LICENSE header on main matches the four Galion Labs lines
result: readiness check passed. The owner merges #13. This script did not.
```

`sh packaging/check-pr-13.sh --merge` exited 2: `refused: this script does not merge pull request 13. The owner merges it.`
