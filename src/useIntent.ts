import { useCallback, useContext, useSyncExternalStore } from 'react';
import { ActionsContext } from './context';
import { dispatchFrom, resolveEnabled, subscribe } from './registry';
import type { Intent, PayloadOf } from './intent';

export interface UseIntentResult<I extends Intent<unknown>> {
  /** Dispatch the intent from this component's scope. Returns whether a handler ran. */
  invoke: (payload: PayloadOf<I>) => boolean;
  /** Whether an enabled handler for the intent exists in this scope chain. */
  isEnabled: boolean;
}

/**
 * Resolves an [intent] from the calling component's scope — so a toolbar button
 * and a keyboard shortcut share the same handler and enabled state.
 */
export function useIntent<I extends Intent<unknown>>(intent: I): UseIntentResult<I> {
  const node = useContext(ActionsContext);
  const isEnabled = useSyncExternalStore(
    subscribe,
    () => resolveEnabled(node, intent.id),
    () => false,
  );
  const invoke = useCallback(
    (payload: PayloadOf<I>) => dispatchFrom(node, intent.id, payload),
    [node, intent.id],
  );
  return { invoke, isEnabled };
}
