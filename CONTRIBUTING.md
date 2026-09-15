# Contributing

## Development

Use Node.js 18 or newer, then install the locked dependencies:

```sh
npm ci
```

Run the test suite before opening a pull request:

```sh
npm test
npm pack --dry-run
```

## Pull requests

- Explain the user-visible change and its compatibility impact.
- Add or update tests for behavior changes.
- Keep the encryption format compatible unless the change introduces a new format version.
- Do not commit credentials, tokens, generated archives, or `node_modules`.

## Releases

Releases are published by GitHub Actions after a maintainer pushes a tag matching `v*` and the tag matches the version in `package.json`.
