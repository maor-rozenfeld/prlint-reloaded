[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m785772948-409b63c8617fcbbc6e9a30a6?style=flat-square)](https://stats.uptimerobot.com/N54K1TN9Kq)

[![Logo](https://avatars3.githubusercontent.com/in/77103?s=41&u=b36fe8dbd2b56b8f634d32e33b2641afef168972&v=4)](https://github.com/apps/prlint-reloaded)

# PRLint Reloaded

A GitHub Action that validates PR titles.

## Usage

Add a `.github/workflows/prlint.yml` file to your repository with the following content:

```yml
name: PR Lint
on:
  pull_request:
    types: ['opened', 'edited', 'reopened', 'synchronize']
jobs:
  prlint-reloaded:
    runs-on: ubuntu-latest
    steps:
      - uses: maor-rozenfeld/prlint-reloaded@actions
        with:
          title-regex: "^[A-Z][a-z]+?\\s"
          error-message: Your title must start with a capital letter, and a real word, e.g. 'Add GO support'
      - uses: maor-rozenfeld/prlint-reloaded@actions
        with:
          title-regex: "^\\S+\\s+\\S+\\s+\\S+"
          error-message: Your title must have at least three words
      - uses: maor-rozenfeld/prlint-reloaded@actions
        with:
          title-regex: "^(?!\\S+ing\\s)(?!\\S+ed\\s)"
          error-message: Use imperative mood (i.e write "Fix", not "Fixed" or "Fixing")
```

## Logo

Logo made by [Eucalyp](https://creativemarket.com/eucalyp) from [Flaticon](https://www.flaticon.com/).

## License

[MIT](/LICENSE)
