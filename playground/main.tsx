import { StrictMode, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { Actions, defineIntent, handle, Shortcuts, useIntent } from '../src';

const SelectAll = defineIntent('select-all');
const ClearAll = defineIntent('clear-all');

const FILES = ['report.pdf', 'photo.png', 'notes.md', 'budget.xlsx'];
const START_ITEMS = ['Item 1', 'Item 2', 'Item 3'];

function App() {
  const [log, setLog] = useState<string[]>([]);
  const push = (m: string) => setLog((l) => [`${time()}  ${m}`, ...l].slice(0, 8));

  const inputRef = useRef<HTMLInputElement>(null);
  const [filesSelected, setFilesSelected] = useState(false);

  // Card 2: a real list that "Clear all" empties.
  const [items, setItems] = useState<string[]>(START_ITEMS);
  const canClear = items.length > 0;

  // Focus the page on load so keyboard shortcuts work immediately.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => pageRef.current?.focus(), []);

  return (
    <Shortcuts map={{ 'Mod+a': SelectAll, 'Mod+d': ClearAll }}>
      {/* "Clear all" wraps the whole app → button + shortcut work from anywhere,
          sharing one enabled state (canClear). */}
      <Actions
        handlers={[
          handle(ClearAll, () => {
            setItems([]);
            push('🗑 Clear all — ran');
          }, { enabled: canClear }),
        ]}
      >
        <div style={s.page} tabIndex={-1} ref={pageRef}>
          <h1 style={s.h1}>
            intentio <span style={s.tag}>playground</span>
          </h1>

          {/* ───── Card 1: same shortcut, different action by focus ───── */}
          <section style={s.card}>
            <h2 style={s.h2}>① Same shortcut, different action (by focus)</h2>
            <p style={s.hint}>
              Click a pane to focus it, then press <kbd style={s.kbd}>⌘/Ctrl</kbd>+
              <kbd style={s.kbd}>A</kbd>. Same key — different result depending on where focus is.
            </p>
            <div style={s.row}>
              <Actions
                handlers={[
                  handle(SelectAll, () => {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                    push('📝 Text field → selected all text');
                  }),
                ]}
              >
                <div style={s.pane}>
                  <div style={s.paneLabel}>Text field</div>
                  <input ref={inputRef} defaultValue="Click here, then Ctrl+A" style={s.input} />
                </div>
              </Actions>

              <Actions
                handlers={[
                  handle(SelectAll, () => {
                    setFilesSelected(true);
                    push('📁 File list → selected all files');
                  }),
                ]}
              >
                <div style={s.pane} tabIndex={0} onMouseDown={() => setFilesSelected(false)}>
                  <div style={s.paneLabel}>File list — click here, then Ctrl+A</div>
                  {FILES.map((f) => (
                    <div key={f} style={{ ...s.file, ...(filesSelected ? s.fileSel : null) }}>
                      {f}
                    </div>
                  ))}
                </div>
              </Actions>
            </div>
          </section>

          {/* ───── Card 2: one command, two triggers, one enabled state ───── */}
          <section style={s.card}>
            <h2 style={s.h2}>② One command = 🖱️ button · ⌨️ shortcut (shared state)</h2>
            <p style={s.hint}>
              Click <b>🗑 Clear all</b>, or press <kbd style={s.kbd}>⌘/Ctrl</kbd>+
              <kbd style={s.kbd}>D</kbd> — <b>both do the same thing</b>. When the list is empty,
              <b> the button and the shortcut both auto-disable</b>.
            </p>

            <div style={s.pane}>
              {items.length === 0 ? (
                <em style={{ color: '#aaa' }}>Empty</em>
              ) : (
                items.map((it) => (
                  <div key={it} style={s.file}>
                    {it}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <ClearButton />
              <button style={s.btnGhost} onClick={() => setItems(START_ITEMS)}>
                ↺ Refill
              </button>
            </div>
            <small style={s.small}>
              {canClear
                ? 'List has items → button & ⌘D are enabled'
                : 'List is empty → button & ⌘D are both disabled'}
            </small>
          </section>

          <section style={s.card}>
            <h2 style={s.h2}>Log</h2>
            {log.length === 0 ? (
              <em style={s.small}>Nothing yet — try the actions above</em>
            ) : (
              log.map((l, i) => (
                <div key={i} style={{ ...s.logline, opacity: 1 - i * 0.09 }}>
                  {l}
                </div>
              ))
            )}
          </section>
        </div>
      </Actions>
    </Shortcuts>
  );
}

function ClearButton() {
  const { invoke, isEnabled } = useIntent(ClearAll);
  return (
    <button
      style={{ ...s.btn, opacity: isEnabled ? 1 : 0.4, cursor: isEnabled ? 'pointer' : 'not-allowed' }}
      disabled={!isEnabled}
      onClick={() => invoke()}
    >
      🗑 Clear all (button)
    </button>
  );
}

function time() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

const s: Record<string, CSSProperties> = {
  page: {
    maxWidth: 680,
    margin: '32px auto',
    padding: 16,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1a1a2e',
    outline: 'none',
  },
  h1: { fontSize: 24, margin: '0 0 12px' },
  tag: {
    fontSize: 12,
    background: '#6366f1',
    color: 'white',
    padding: '2px 8px',
    borderRadius: 999,
    verticalAlign: 'middle',
  },
  hint: { color: '#555', lineHeight: 1.6, fontSize: 14, margin: '0 0 10px' },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  card: {
    border: '1px solid #e3e3ee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    background: '#fbfbff',
  },
  h2: { fontSize: 16, margin: '0 0 8px' },
  pane: {
    flex: '1 1 240px',
    border: '1px solid #d9d9ea',
    borderRadius: 8,
    padding: 12,
    background: 'white',
    outline: 'none',
  },
  paneLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cfcfe0',
    fontSize: 14,
  },
  file: { padding: '6px 10px', borderRadius: 6, marginBottom: 4, background: '#eef0f7', fontSize: 14 },
  fileSel: { background: '#c7d2fe', outline: '2px solid #6366f1' },
  small: { display: 'block', marginTop: 8, color: '#888', fontSize: 12 },
  btn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#ef4444',
    color: 'white',
    fontSize: 14,
  },
  btnGhost: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #cfcfe0',
    background: 'white',
    fontSize: 14,
    cursor: 'pointer',
  },
  logline: { fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: '2px 0' },
  kbd: { background: '#eee', border: '1px solid #ccc', borderRadius: 4, padding: '1px 5px', fontSize: 12 },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
