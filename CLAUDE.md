# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repo is named `bobberdolle1`, matching the GitHub username — GitHub renders its `README.md` directly on the user's profile page (github.com/bobberdolle1). Most of the repo's content is that README: a stylized, meme-heavy profile page (capsule-render banners, typing SVGs, stat/streak/trophy widgets, a Rust-flavored "whoami" block, a featured-projects table). Edits to `README.md` are edits to the public profile, not application code — treat wording/tone changes there as content edits, not refactors.

There is no build system, package manifest, or test suite in this repo.

## Structure

- `README.md` — the GitHub profile page content described above.
- `termvibes/vibes.py` — standalone, dependency-free Python 3 script: a terminal ANSI/ASCII animation toy (matrix rain, fire, plasma, starfield, DVD-bounce logo). Single file, no package structure; not imported by anything else in the repo.
- `.github/workflows/snake.yml` — scheduled GitHub Action (`Platane/snk`) that regenerates a contribution "snake" SVG and pushes it to the `output` branch, consumed by an image embed elsewhere (the Spotify/snake badges have been added and removed from the README over time — check current README state before assuming a badge is live).

## Working with termvibes/vibes.py

Run it directly — no dependencies beyond the Python 3 standard library (`termios`/`tty`, so it needs a real TTY, not a piped/non-interactive shell):

```bash
python3 termvibes/vibes.py
```

Keys: `1`-`5` switch effects (matrix/fire/plasma/starfield/dvd), `space` pauses, `q`/Ctrl-C quits.

Each effect is a small self-contained class in `EFFECTS` with `__init__(w, h)`, `resize(w, h)`, and `frame(t) -> rows` (a `[[(char, (r,g,b) or None), ...]]` grid). `render_rows` collapses a frame into one escape-coded string, only emitting a new `\x1b[38;2;r;g;bm` when the color actually changes. Adding a new effect means adding a class with that interface and registering it in `EFFECTS`.

To sanity-check syntax without a TTY:

```bash
python3 -m py_compile termvibes/vibes.py
```
