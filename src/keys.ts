export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPod|iPad/.test(
    // navigator.platform is deprecated but still the most reliable signal here.
    (navigator as unknown as { platform?: string }).platform ?? navigator.userAgent ?? '',
  );

/** A parsed keybinding. `mod` is the platform-primary modifier (⌘ on macOS, Ctrl elsewhere). */
export interface Chord {
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  del: 'delete',
  return: 'enter',
  spacebar: 'space',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
};

function normKey(k: string): string {
  if (k === ' ') return 'space';
  const l = k.toLowerCase();
  return KEY_ALIASES[l] ?? l;
}

/** Parses a binding like `"Mod+Shift+p"` / `"Delete"` / `"Ctrl+a"`. */
export function parseBinding(binding: string): Chord {
  const c: Chord = { mod: false, ctrl: false, meta: false, alt: false, shift: false, key: '' };
  for (const raw of binding.split('+')) {
    const l = raw.trim().toLowerCase();
    if (l === 'mod') c.mod = true;
    else if (l === 'ctrl' || l === 'control') c.ctrl = true;
    else if (l === 'meta' || l === 'cmd' || l === 'command' || l === 'super' || l === 'win') c.meta = true;
    else if (l === 'alt' || l === 'option' || l === 'opt') c.alt = true;
    else if (l === 'shift') c.shift = true;
    else c.key = normKey(raw.trim());
  }
  return c;
}

/** True if [e] satisfies [chord], resolving `mod` to the platform-primary modifier. */
export function matchesChord(chord: Chord, e: KeyboardEvent): boolean {
  if (normKey(e.key) !== chord.key) return false;
  if (e.shiftKey !== chord.shift) return false;
  if (e.altKey !== chord.alt) return false;

  const primary = IS_MAC ? e.metaKey : e.ctrlKey;
  const secondary = IS_MAC ? e.ctrlKey : e.metaKey;

  if (chord.mod) {
    if (!primary) return false;
    // "Mod+x" with no explicit secondary modifier must not match "Mod+Ctrl+x".
    if (!chord.ctrl && !chord.meta && secondary) return false;
    return true;
  }
  return e.ctrlKey === chord.ctrl && e.metaKey === chord.meta;
}
