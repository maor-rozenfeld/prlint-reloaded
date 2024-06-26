[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m785772948-409b63c8617fcbbc6e9a30a6?style=flat-square)](https://stats.uptimerobot.com/N54K1TN9Kq)


# [![Logo](https://avatars3.githubusercontent.com/in/77103?s=41&u=b36fe8dbd2b56b8f634d32e33b2641afef168972&v=4)](https://github.com/apps/prlint-reloaded) PRLint Reloaded

PRLint Reloaded lets you validate PR metadata using regular expressions, and then fail or pass the PR based on the validation results.

There are two installation types, GitHub App and GitHub Action. The GitHub App is faster and provides more capabilities, while the GitHub Action is more isolated and independent.

## GitHub App

The GitHub App can validate various PR metadata, such as title, description, and labels. It is a copy of [ewolfe/prlint](https://github.com/ewolfe/prlint) wrapped in a serverless deployment.

Simple add a `.github/prlint.json` file to your repository and [install the app from the marketplace](https://github.com/apps/prlint-reloaded).

Example rules:

```json
{
  "title": [
    {
      "pattern": "^(build|ci|docs|feat|fix|perf|refactor|style|test):\\s",
      "message": "Your title needs to be prefixed with a topic"
    }
  ],
  "body": [
    {
      "pattern": "JIRA-\\d{1,4}",
      "flags": ["i"],
      "message": "You need a JIRA ticket in your description"
    },
    {
      "pattern": ".{1,}",
      "message": "You need literally anything in your description"
    }
  ],
  "head.ref": [
    {
      "pattern": "^(build|ci|docs|feat|fix|perf|refactor|style|test)/",
      "message": "Your branch name is invalid"
    }
  ],
  "assignee.login": [
    {
      "pattern": ".+",
      "message": "You need to assign someone"
    }
  ],
  "requested_teams.0.id": [
    {
      "pattern": "2691982",
      "message": "The product team needs to be added as a reviewer"
    }
  ],
  "additions": [
    {
      "pattern": "0|^[1-9]$|^[1-9]\\d$",
      "message": "Your PR is too big (over 99 additions)"
    }
  ],
  "labels.0.name": [
    {
      "pattern": "bug|enhancement|question",
      "message": "Please add a label"
    }
  ]
}
```

## GitHub Action

The GitHub Action only validates PR titles.

Create a `.github/workflows/prlint.yml` file in your repository with the following content:

```yml
name: PR Lint
on:
  pull_request:
    types: ['opened', 'edited', 'reopened', 'synchronize']
jobs:
  prlint-reloaded:
    runs-on: ubuntu-latest
    steps:
      - uses: maor-rozenfeld/prlint-reloaded@v1
        with:
          title-regex: ^[A-Z][a-z]+?\s
          error-message: Your title must start with a capital letter, and a real word, e.g. 'Add GO support'
      - uses: maor-rozenfeld/prlint-reloaded@v1
        with:
          title-regex: ^\S+\s+\S+\s+\S+
          error-message: Your title must have at least three words
      - uses: maor-rozenfeld/prlint-reloaded@v1
        with:
          title-regex: ^(?!\S+ing\s)(?!\S+ed\s)
          error-message: Use imperative mood (i.e write "Fix", not "Fixed" or "Fixing")
```

Edit the `title-regex` and `error-message` fields to match your requirements.
