import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { parseBinding } from './keys';
import { ensureListener, registerShortcuts, releaseListener, unregisterShortcuts } from './registry';
import type { Intent } from './intent';

const DISPLAY_CONTENTS = { display: 'contents' } as const;

/**
 * A shortcut target: an intent, or `[intent, payload]` to carry a value with the
 * key press (e.g. `'Mod+Backspace': [Delete, { soft: true }]`).
 */
export type ShortcutTarget = Intent<unknown> | readonly [Intent<unknown>, unknown];

export interface ShortcutsProps {
  /** Map of binding string (`"Mod+a"`, `"Delete"`, `"Mod+Shift+p"`) → target. */
  map: Record<string, ShortcutTarget>;
  children: ReactNode;
}

/**
 * Binds keys to intents for its focus subtree. Deepest scope containing focus
 * wins, so an inner `Shortcuts` can override an outer binding. The actual
 * behavior is decided by the matching [Actions] scope, not here.
 */
export function Shortcuts({ map, children }: ShortcutsProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const bindings = Object.entries(map).map(([binding, target]) => {
    const [intent, payload] = Array.isArray(target)
      ? (target as readonly [Intent<unknown>, unknown])
      : [target as Intent<unknown>, undefined];
    return { chord: parseBinding(binding), intentId: intent.id, payload };
  });

  // Re-register bindings every render (cheap map write); keep the doc listener once.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerShortcuts(el, bindings);
    return () => unregisterShortcuts(el);
  });

  useLayoutEffect(() => {
    ensureListener();
    return () => releaseListener();
  }, []);

  return (
    <div ref={ref} style={DISPLAY_CONTENTS}>
      {children}
    </div>
  );
}
