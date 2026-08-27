# GitHub Contribution Graph Generator

A local-first web tool for drawing a GitHub contribution heatmap and exporting a
reviewable Bash script that creates the planned commits.

The flow is three steps, top to bottom: **draw → configure → export**.

## Features

**Drawing**

- Paint the grid by clicking or dragging; hold <kbd>Alt</kbd> to erase
- Five brush levels, selectable with <kbd>0</kbd>–<kbd>4</kbd>
- Undo / redo (<kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd>)
- Patterns: natural, dense, weekdays, wave, ramp up
- Write text into the graph with a built-in 5×7 pixel font, positioned live
- Import an image and tune inversion and cut-off, sampled in your browser

**Everything else**

- English and Chinese interface, matched to your browser on first run
- Light and dark themes, following your system by default
- Repository, branch, date range, timezone, commit identity and daily commit range
- Timezone detected from your machine
- Settings and drawing are kept in `localStorage` between visits
- Copy or download a macOS/Linux-compatible Bash script
- Skip dates that already have commits, so the script is safe to re-run
- No passwords, tokens, repository settings, or images leave the page

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Authentication

The generated script uses your existing Git credentials, SSH key, or GitHub CLI
login. If needed, authenticate first:

```bash
gh auth login
```

Use an author email verified on your GitHub account, and target the repository's
default branch or `gh-pages` for contributions to appear on your profile.

Review every generated script before running it. Backfilled commits do not
represent real work — use this on your own repositories, and be honest about it.

## License

MIT
