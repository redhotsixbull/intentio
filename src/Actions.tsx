import { useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { ActionsContext } from './context';
import { notify, registerActions, unregisterActions, type ScopeNode } from './registry';
import type { Intent, PayloadOf } from './intent';

// Layout-transparent wrapper: marks a DOM subtree as a scope without affecting layout.
const DISPLAY_CONTENTS = { display: 'contents' } as const;

/** A single intent→handler binding for [Actions]. Create with [handle]. */
export interface HandlerSpec {
  readonly id: string;
  readonly run: (payload: unknown) => void;
  readonly enabled: boolean;
}

/** Binds an [intent] to a handler, with optional `enabled`. Type-safe on the payload. */
export function handle<I extends Intent<unknown>>(
  intent: I,
  run: (payload: PayloadOf<I>) => void,
  opts?: { enabled?: boolean },
): HandlerSpec {
  return {
    id: intent.id,
    run: run as (payload: unknown) => void,
    enabled: opts?.enabled ?? true,
  };
}

export interface ActionsProps {
  handlers: HandlerSpec[];
  children: ReactNode;
}

/**
 * Provides intent handlers to its focus subtree. When an intent is dispatched
 * (by a shortcut, a palette, or [useIntent]), the nearest enclosing `Actions`
 * with an *enabled* handler for it wins — inner scopes override outer ones.
 */
export function Actions({ handlers, children }: ActionsProps) {
  const parent = useContext(ActionsContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<ScopeNode | null>(null);
  if (nodeRef.current === null) nodeRef.current = { handlers: new Map(), parent };

  const node = nodeRef.current;
  node.parent = parent;
  // Rebuild the handler map in place so the stable node object stays registered.
  node.handlers.clear();
  for (const h of handlers) node.handlers.set(h.id, { run: h.run, enabled: h.enabled });

  // After commit, let useIntent subscribers recompute enabled state.
  useEffect(() => {
    notify();
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerActions(el, node);
    return () => unregisterActions(el);
  }, [node]);

  return (
    <ActionsContext.Provider value={node}>
      <div ref={ref} style={DISPLAY_CONTENTS}>
        {children}
      </div>
    </ActionsContext.Provider>
  );
}
