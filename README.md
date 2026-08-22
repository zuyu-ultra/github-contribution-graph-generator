# GitHub Contribution Graph Generator

A local-first web tool for designing a GitHub contribution heatmap and generating a reviewable Bash script that creates the planned commits.

## Features

- English and Chinese interface
- Custom repository, branch, date range, timezone, and daily commit range
- Natural, dense, workweek, wave, and hand-painted heatmap patterns
- Import an image as a heatmap reference
- Copy or download a macOS/Linux-compatible Bash script
- Skip dates that already have commits in the target repository
- No passwords, tokens, repository settings, or images are uploaded by the app

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

The generated script uses your existing Git credentials, SSH key, or GitHub CLI login. If needed, authenticate first:

```bash
gh auth login
```

Use an author email linked to your GitHub account, and target the repository's default branch or `gh-pages` for contributions to appear on your profile.

Review every generated script before running it. Use this project responsibly and represent your work honestly.

## License

MIT
