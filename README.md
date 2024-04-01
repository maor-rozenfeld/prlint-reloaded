# PRLint Reloaded

PRLint Reloaded lets you validate PR metadata using regular expressions, and then fail or pass the PR based on the validation results.

There are two installation types, GitHub App and GitHub Action. The GitHub App is faster and provides more capabilities, while the GitHub Action is more isolated and independent.

## GitHub App

The GitHub App can validate various PR metadata, such as title, description, and labels. It is a copy of [ewolfe/prlint](https://github.com/ewolfe/prlint) wrapped in a serverless deployment.

Simple add a `.github/prlint.json` file to your repository and [install the app from the marketplace](https://github.com/apps/prlint-reloaded).


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


## Logo

Logo made by [Eucalyp](https://creativemarket.com/eucalyp) from [Flaticon](https://www.flaticon.com/).
