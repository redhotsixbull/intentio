import { matchesChord, type Chord } from './keys';

export interface HandlerEntry {
  run: (payload: unknown) => void;
  enabled: boolean;
}

/** One node in the focus-scope chain, mirroring the React `Actions` tree. */
export interface ScopeNode {
  handlers: Map<string, HandlerEntry>;
  parent: ScopeNode | null;
}

export interface Binding {
  chord: Chord;
  intentId: string;
  /** Value carried by this shortcut, handed to the handler. */
  payload: unknown;
}

// DOM element → scope, so we can resolve from `document.activeElement`.
const actionScopes = new Map<HTMLElement, ScopeNode>();
const shortcutScopes = new Map<HTMLElement, Binding[]>();

export function registerActions(el: HTMLElement, node: ScopeNode): void {
  actionScopes.set(el, node);
}
export function unregisterActions(el: HTMLElement): void {
  actionScopes.delete(el);
}
export function registerShortcuts(el: HTMLElement, bindings: Binding[]): void {
  shortcutScopes.set(el, bindings);
}
export function unregisterShortcuts(el: HTMLElement): void {
  shortcutScopes.delete(el);
}

// ── reactivity for useIntent.isEnabled ──────────────────────────────────────
const listeners = new Set<() => void>();
export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function notify(): void {
  for (const l of listeners) l();
}

// ── resolution ──────────────────────────────────────────────────────────────
function domDepth(el: HTMLElement): number {
  let d = 0;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) d++;
  return d;
}

function deepestActionScope(target: Node): ScopeNode | null {
  let best: ScopeNode | null = null;
  let bestDepth = -1;
  for (const [el, node] of actionScopes) {
    if (el.contains(target)) {
      const d = domDepth(el);
      if (d > bestDepth) {
        bestDepth = d;
        best = node;
      }
    }
  }
  return best;
}

function resolveBinding(target: Node, e: KeyboardEvent): Binding | null {
  // Deepest shortcut scope containing focus wins (inner bindings override outer).
  const containing: { d: number; bindings: Binding[] }[] = [];
  for (const [el, bindings] of shortcutScopes) {
    if (el.contains(target)) containing.push({ d: domDepth(el), bindings });
  }
  containing.sort((a, b) => b.d - a.d);
  for (const { bindings } of containing) {
    for (const b of bindings) if (matchesChord(b.chord, e)) return b;
  }
  return null;
}

/** Walks from [start] up the parent chain; returns true if any *enabled* handler exists. */
export function resolveEnabled(start: ScopeNode | null, intentId: string): boolean {
  for (let n = start; n; n = n.parent) {
    const entry = n.handlers.get(intentId);
    if (entry && entry.enabled) return true;
  }
  return false;
}

/** Dispatches to the nearest *enabled* handler (skipping disabled ones). Returns whether it ran. */
export function dispatchFrom(start: ScopeNode | null, intentId: string, payload: unknown): boolean {
  for (let n = start; n; n = n.parent) {
    const entry = n.handlers.get(intentId);
    if (entry && entry.enabled) {
      entry.run(payload);
      return true;
    }
  }
  return false;
}

// ── the single global key listener ──────────────────────────────────────────
let refCount = 0;
let installed = false;

function onKeyDown(e: KeyboardEvent): void {
  const active: Node = document.activeElement ?? document.body;
  const binding = resolveBinding(active, e);
  if (!binding) return;
  // The app has claimed this key → stop the browser default (e.g. ⌘D bookmark),
  // whether or not an enabled handler ultimately runs. Unbound keys fall through
  // untouched (we returned above), so normal typing is unaffected.
  e.preventDefault();
  e.stopPropagation();
  dispatchFrom(deepestActionScope(active), binding.intentId, binding.payload);
}

export function ensureListener(): void {
  if (++refCount === 1 && !installed && typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeyDown);
    installed = true;
  }
}
export function releaseListener(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && installed) {
    document.removeEventListener('keydown', onKeyDown);
    installed = false;
  }
}
