# Changelog

## 0.1.2

Documentation hygiene — no API changes.

- **The README no longer carries version numbers.** The "Status & roadmap"
  section restated the release (`0.1.1 — core dispatch …`) and the Development
  section hardcoded a test count, both needing an edit every release. `package.json`
  is the version, this file is the history, and the npm badge renders the current
  number; the README describes only what the library does.
- **New: `test/docs.test.ts`** — two guards that fail `pnpm test` rather than
  relying on remembering: the README must contain no version literal, and every
  **runtime** export from `src/index.ts` must appear in the README's API table.
  (`export type` lines are exempt on purpose — the API table is for things you
  call or render, and types are visible in the editor.)
- **New: this file.** intentio had no changelog, so there was nowhere for the
  README to point when its version stamp came out.
- Added `@types/node` as a dev dependency so the new test typechecks under
  `tsc --noEmit` (it reads files from disk).

## 0.1.1

First published release. `0.1.0` was tagged but never reached npm — the name had
been used and unpublished previously, which blocks reuse of that exact version.

- Focus-scoped command dispatch for React: one intent, dispatched by keyboard
  shortcuts, buttons, and (soon) a command palette alike, resolved by where
  focus is.
- `defineIntent` / `<Shortcuts>` / `<Actions>` + `handle` / `useIntent`.
- Payload-carrying shortcuts (`[intent, payload]` in a `Shortcuts` map).
- Keybinding parser with `Mod` (⌘ on macOS, Ctrl elsewhere), modifiers, and
  named keys.
- Playground app, demo GIF, and hero banner.
