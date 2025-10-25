# Running Frontend Tests

This project uses Vitest + React Testing Library + MSW for the frontend test suite.

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+

## Install Dependencies

From the repository root:

```
npm install
```

This installs workspace dependencies, including the frontend test tools.

## Run All Frontend Tests

From the repository root (workspace-aware):

```
npm -w frontend run test
```

Or run inside the frontend package:

```
cd packages/frontend
npm run test
```

## Watch Mode (TDD)

```
npm -w frontend run test:watch
```

## Run a Specific Test File

```
npm -w frontend run test -- ../../tests/unit/tokenManager.test.js
```

You can also pass a pattern:

```
npm -w frontend run test -- ../../tests/unit/*Login*.test.*
```

## Coverage

Vitest supports coverage via V8 instrumentation. You can try:

```
// from repo root (workspace)
npm -w frontend run test:cov
```

The coverage configuration is set in `packages/frontend/vite.config.js` under `test.coverage` and writes HTML to `tests/coverage`.

## Test Stack

- Runner: Vitest (jsdom environment)
- DOM utils: @testing-library/react, @testing-library/user-event
- Mock server: MSW (Node) — automatically started/stopped via `src/setupTests.js`

## Where Tests Live

All frontend unit tests are under `tests/unit/`.

Key files:

- `packages/frontend/src/setupTests.js` — global test setup (jest-dom, MSW lifecycle)
- `tests/unit/mocks/*` — shared mocks and test utilities

## Common Scenarios

- API calls are mocked — no backend needed while running tests.
- Three.js / R3F components are mocked where necessary to run under jsdom.
- OAuth/Token flows are verified using unsigned JWTs in tests.

## Troubleshooting

- If npm install fails in `packages/frontend`: ensure `package.json` has valid dependency entries and rerun `npm install` from the repo root.
- If tests complain about navigation/location: jsdom does not implement full navigation — tests stub `window.location.replace` where needed.
- If a test hangs due to network: confirm the MSW handler exists in `handlers.js` for that endpoint; add or override in the test via `server.use(...)`.
