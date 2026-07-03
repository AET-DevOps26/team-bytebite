# client

React + Vite + TypeScript frontend for ByteBite.

## Prerequisites

- Node 18+

## Setup & Run

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

## Other Commands

```bash
npm run build     # production build → dist/
npm run lint      # ESLint
npm run preview   # preview production build locally
```

## Testing

Tests run on [Vitest](https://vitest.dev) with [React Testing Library](https://testing-library.com/react)
in a jsdom environment. Config lives in the `test` block of [vite.config.ts](vite.config.ts); the
per-run setup (jest-dom matchers, DOM cleanup, `matchMedia`/`scrollTo` stubs) is in
[src/test/setup.ts](src/test/setup.ts).

```bash
npm test              # run the whole suite once (used by CI)
npm run test:watch    # re-run on change while developing
npx vitest run <path> # run a single file, e.g. src/lib/mappers.test.ts
```

### What's covered

Tests sit next to the code they exercise (`*.test.ts` / `*.test.tsx`), in three tiers:

- **Unit** — [src/lib/mappers.test.ts](src/lib/mappers.test.ts): the pure API↔view-model
  converters (quantity `null ↔ "N/A"`, item-payload mapping, derived counts).
- **Component** — [src/components/](src/components/): `AuthCard`, `ItemListForm` and
  `GroceryListView` rendered in isolation, driving real user interactions (form validation,
  add/remove rows, optimistic toggle with rollback, loading/error/empty states).
- **Integration** — [src/App.integration.test.tsx](src/App.integration.test.tsx): the real `App`
  with `fetch` mocked at the network boundary, covering core workflows — login bootstrap, session
  expiry, merging recipes into a grocery list across views, manual create, optimistic-delete
  rollback, and failed-load retry.

No network or backend is needed — `fetch` is mocked, so the suite is fast and deterministic. It runs
automatically in CI (see [`.github/workflows/test-build-push.yml`](../.github/workflows/test-build-push.yml))
and gates image builds, so a failing test blocks the merge.
