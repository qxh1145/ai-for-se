# Tests

This repository organizes tests under `tests/` with the following structure:

```
tests/
  unit/
    [feature-name].test.js
    mocks/
      [dependency-mocks].js
  coverage/
    index.html
  README.md
```

- Unit tests live in `tests/unit`.
- Shared test doubles and utilities go in `tests/unit/mocks`.
- Coverage HTML output is written to `tests/coverage` when running coverage.

Note: Integration-style tests for the frontend are co-located in `tests/unit` and named accordingly (e.g., `api.interceptors.test.js`).

## Run tests

From the repository root:

- All tests: `npm -w frontend run test`
- Watch mode: `npm -w frontend run test:watch`
- Coverage (HTML written to `tests/coverage`): `npm -w frontend run test:cov`
