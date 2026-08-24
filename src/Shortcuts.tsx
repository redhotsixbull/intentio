import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { parseBinding } from './keys';
import { ensureListener, registerShortcuts, releaseListener, unregisterShortcuts } from './registry';
import type { Intent } from './intent';

const DISPLAY_CONTENTS = { display: 'contents' } as const;

export interface ShortcutsProps {
  /** Map of binding string (`"Mod+a"`, `"Delete"`, `"Mod+Shift+p"`) → intent. */
  map: Record<string, Intent<unknown>>;
  children: ReactNode;
}

/**
 * Binds keys to intents for its focus subtree. Deepest scope containing focus
 * wins, so an inner `Shortcuts` can override an outer binding. The actual
 * behavior is decided by the matching [Actions] scope, not here.
 */
export function Shortcuts({ map, children }: ShortcutsProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const bindings = Object.entries(map).map(([binding, intent]) => ({
    chord: parseBinding(binding),
    intentId: intent.id,
  }));

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
