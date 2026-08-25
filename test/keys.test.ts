import { describe, expect, it } from 'vitest';
import { matchesChord, parseBinding } from '../src/keys';

// jsdom's navigator.platform is empty → IS_MAC is false, so `Mod` resolves to Ctrl.
function ev(
  key: string,
  mods: Partial<{ ctrl: boolean; meta: boolean; alt: boolean; shift: boolean }> = {},
): KeyboardEvent {
  return {
    key,
    ctrlKey: !!mods.ctrl,
    metaKey: !!mods.meta,
    altKey: !!mods.alt,
    shiftKey: !!mods.shift,
  } as KeyboardEvent;
}

const match = (binding: string, e: KeyboardEvent) => matchesChord(parseBinding(binding), e);

describe('key parsing & matching', () => {
  it('parses modifiers and the key', () => {
    expect(parseBinding('Mod+Shift+p')).toEqual({
      mod: true,
      ctrl: false,
      meta: false,
      alt: false,
      shift: true,
      key: 'p',
    });
  });

  it('Mod resolves to Ctrl on non-mac', () => {
    expect(match('Mod+a', ev('a', { ctrl: true }))).toBe(true);
    expect(match('Mod+a', ev('a', { meta: true }))).toBe(false); // meta is the secondary here
    expect(match('Mod+a', ev('a'))).toBe(false); // no modifier
  });

  it('does not match when extra modifiers are held', () => {
    expect(match('Mod+a', ev('a', { ctrl: true, shift: true }))).toBe(false);
    expect(match('Mod+a', ev('a', { ctrl: true, alt: true }))).toBe(false);
  });

  it('matches explicit Ctrl / Shift / Alt combos', () => {
    expect(match('Ctrl+a', ev('a', { ctrl: true }))).toBe(true);
    expect(match('Shift+Delete', ev('Delete', { shift: true }))).toBe(true);
    expect(match('Alt+Enter', ev('Enter', { alt: true }))).toBe(true);
  });

  it('is case-insensitive on letters', () => {
    expect(match('Mod+A', ev('a', { ctrl: true }))).toBe(true);
    expect(match('Mod+a', ev('A', { ctrl: true }))).toBe(true);
  });

  it('matches a plain key with no modifiers, and rejects it with modifiers', () => {
    expect(match('Escape', ev('Escape'))).toBe(true);
    expect(match('Escape', ev('Escape', { ctrl: true }))).toBe(false);
  });

  it('normalizes key aliases (esc, del, arrows, space)', () => {
    expect(match('Esc', ev('Escape'))).toBe(true);
    expect(match('Del', ev('Delete'))).toBe(true);
    expect(match('Up', ev('ArrowUp'))).toBe(true);
    expect(match('Space', ev(' '))).toBe(true);
  });

  it('Mod+Backspace matches a Ctrl+Backspace event (non-mac)', () => {
    expect(match('Mod+Backspace', ev('Backspace', { ctrl: true }))).toBe(true);
  });
});
