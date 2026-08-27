<div align="center">

<img src="docs/logo.png" width="72" height="72" alt="">

# Kusa · 种草

**Draw a GitHub contribution graph, export a Bash script you can actually read.**

Kusa runs entirely in your browser. Nothing is uploaded — no passwords, no tokens,
no repository settings, no images. It produces a plain shell script; you read it,
then you decide whether to run it.

[Report an issue](https://github.com/zuyu-ultra/github-contribution-graph-generator/issues)
· [How GitHub counts contributions](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)

</div>

---

## What it does

The flow is three steps, top to bottom.

1. **Draw** — paint the year's grid directly, or start from a pattern and adjust.
2. **Configure** — point it at a repository, branch and date range.
3. **Export** — read the generated script, copy or download it, run it yourself.

The script clones your repository into a temp directory, creates empty commits
with backdated `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` values, pushes, and cleans
up after itself. It never handles credentials — the push uses whatever Git auth
you already have.

## Features

### Drawing

| | |
|---|---|
| Freehand | Click or drag across the grid; hold <kbd>Alt</kbd> to erase |
| Brushes | Five shades, selectable with <kbd>0</kbd>–<kbd>4</kbd> |
| History | Undo / redo, 60 steps |
| Patterns | Natural, dense, weekdays, wave, ramp up |
| Text | Write words into the graph with a built-in 5×7 pixel font, positioned live |
| Images | Import a picture and tune inversion and cut-off, sampled in your browser |

Text and image tools preview on the real grid before you commit them, so you can
see exactly what you'll get.

### Everything else

- English and Chinese interface, matched to your browser on first run
- Light and dark themes, following your system by default
- Timezone detected from your machine
- Settings and drawing persist in `localStorage` between visits
- Narrowing the date range never destroys your drawing — widen it and it comes back
- Skip days that already have commits, so the script is safe to re-run

### Keyboard

| Key | Action |
|---|---|
| <kbd>0</kbd>–<kbd>4</kbd> | Select brush shade |
| <kbd>Alt</kbd> + drag | Erase |
| <kbd>⌘Z</kbd> / <kbd>Ctrl+Z</kbd> | Undo |
| <kbd>⇧⌘Z</kbd> / <kbd>Ctrl+Shift+Z</kbd> | Redo |
| <kbd>Esc</kbd> | Cancel the text or image tool |

## How shades become commits

Each cell holds a shade from 0 to 4. You set the commit count for shade 1 and
shade 4; the shades in between are interpolated. With the default 1 → 4:

| Shade | Commits |
|---|---|
| 0 | 0 — the day is skipped entirely |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |

Commits within a day are spread across working hours so the history reads
plausibly rather than landing at the same second.

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build      # type-checks, then emits dist/
npm run preview    # serve the build locally
```

The build is a static bundle — `dist/` can be served from GitHub Pages, Netlify,
Vercel, or any static host with no configuration.

## Running the generated script

```bash
chmod +x generate-contributions.sh
./generate-contributions.sh
```

It uses your existing Git credentials, SSH key, or GitHub CLI login. Authenticate
first if you need to:

```bash
gh auth login
```

## What GitHub actually counts

A commit shows up on your profile graph only when **all** of these hold:

- the author email is verified on your GitHub account
- the repository is not a fork
- the commit is on the repository's default branch or `gh-pages`

Use an author email linked to your account, and target the default branch. The
graph can take a few minutes to refresh after a push.

## A note on honesty

Backfilled commits do not represent real work, and this tool does not pretend
otherwise. Use it on your own repositories, for your own reasons — learning how
Git dates work, making a graph you enjoy looking at, drawing something for fun.
Don't use it to misrepresent your work to an employer or anyone else.

Read every generated script before you run it. That is the whole reason the tool
hands you a script instead of doing it for you.

## Project layout

```
src/
  lib/          date maths, heatmap model, pixel font, script generation, persistence
  components/   Canvas, Toolbar, Settings, Export
  i18n.ts       all interface copy, English and Chinese
  App.tsx       state, history and layout
public/         favicons
```

## License

[MIT](LICENSE) © [zuyu-ultra](https://github.com/zuyu-ultra)
