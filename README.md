# intentio

**Focus-scoped command dispatch for React.** One command (an _intent_), dispatched
by keyboard shortcuts, a command palette, and buttons alike — resolved by **where
focus is**, not by a flat global keymap.

It's Flutter's `Actions` / `Intents` / `Shortcuts` system, brought to the web.

> Status: `0.1.0` — early, core only. API may change.

## Why

A flat hotkey library answers _"when key X is pressed, run function F."_ Real
keyboard-driven apps (editors, design tools, data grids, Linear/Superhuman-style
apps) need more: the **same key should mean different things depending on what's
focused**, and one command should be reachable from a shortcut, a Cmd-K palette,
and a toolbar button — sharing one enabled state.

`Ctrl+A` in a text field selects text; in a file list selects files; in a canvas
selects shapes. With flat hotkeys you write an `if (where am I?)` ladder that rots
as the app grows. intentio resolves it by the focus tree instead.

## Three layers (decoupled)

```
key press → Shortcuts (keymap)   → Intent (abstract command)
          → Actions (nearest focused scope decides what it does)
```

- **`Shortcuts`** maps keys → intents. Write it once, high in the tree.
- **`Intent`** is an abstract command (`SelectAll`), not a function.
- **`Actions`** binds an intent → a handler, scoped to its subtree. The **nearest
  enclosing `Actions` with focus** wins; inner scopes override outer ones; a
  disabled handler is skipped so an enabled ancestor can take over.

## Quick start

```tsx
import { defineIntent, Shortcuts, Actions, handle, useIntent } from 'intentio';

const SelectAll = defineIntent('select-all');

function App() {
  return (
    // 1. One keymap for the whole app.
    <Shortcuts map={{ 'Mod+a': SelectAll }}>
      {/* 2. The text field's meaning of "select all". */}
      <Actions handlers={[handle(SelectAll, () => inputRef.current?.select())]}>
        <input ref={inputRef} />
      </Actions>

      {/* 3. The list's meaning of the SAME command — no new keybinding. */}
      <Actions handlers={[handle(SelectAll, () => selectAllFiles())]}>
        <div tabIndex={0}>…file list…</div>
      </Actions>
    </Shortcuts>
  );
}
```

`Mod` is ⌘ on macOS and Ctrl elsewhere.

### One intent, shared by a button + shortcut + enabled state

```tsx
const Delete = defineIntent<{ soft?: boolean }>('delete');

function Toolbar() {
  const { invoke, isEnabled } = useIntent(Delete);
  // Same source of truth as the shortcut: greys out together.
  return <button disabled={!isEnabled} onClick={() => invoke({ soft: true })}>Delete</button>;
}

<Actions handlers={[handle(Delete, ({ soft }) => trash(soft), { enabled: hasSelection })]}>
  <Toolbar />
  <FileGrid />
</Actions>
```

## API

- `defineIntent<Payload>(name?)` → an `Intent`. Identity-based; the name is for
  debugging/palette labels.
- `<Shortcuts map={{ 'Mod+a': SelectAll }}>` — keybinding → intent, scoped to its
  subtree (deepest focused scope wins).
- `handle(intent, run, { enabled? })` — build one binding; `run` is typed on the
  intent's payload.
- `<Actions handlers={[handle(...)]}>` — provide handlers to the focus subtree.
- `useIntent(intent)` → `{ invoke(payload), isEnabled }` for buttons/palette items.

## Status & roadmap

Core dispatch only in `0.1.0`. Planned: a first-class command-palette adapter
(derive the palette from reachable + enabled intents), key sequences/chords,
`aria-keyshortcuts` wiring, and an override-with-call-through helper.

## License

MIT
