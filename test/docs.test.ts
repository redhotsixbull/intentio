// Guards against the documentation drifting from the code — the TypeScript
// counterpart of the `docs_freshness_test.dart` / `readme_snippets_test.dart`
// pair used by the Flutter packages in this workspace.
//
// The mistakes these catch actually happened next door: a README that restated
// the version and went stale (pub.dev served a README calling a shipped release
// a prerelease, for the whole release), and public API added with no entry in
// the reference.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

// vitest runs with the project root as cwd.
const read = (p: string): string => readFileSync(join(process.cwd(), p), 'utf8');

describe('docs stay current', () => {
  it('README carries no version literals', () => {
    // Versions rot. `package.json` is the source of truth and the npm badge
    // renders the current number — the README should never restate either.
    const offenders = read('README.md')
      .split('\n')
      .filter((line) => !line.includes('img.shields.io'))
      .filter((line) => /\d+\.\d+\.\d+(-\w+\.\d+)?/.test(line))
      .map((line) => line.trim());

    expect(
      offenders,
      `README.md must not hardcode versions. Offending lines:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('CHANGELOG top entry matches package.json version', () => {
    const version = JSON.parse(read('package.json')).version as string;
    const newest = /^##\s+(\S+)/m.exec(
      read('CHANGELOG.md').replace(/^# Changelog\n/, ''),
    )?.[1];

    expect(
      newest,
      'CHANGELOG.md must open with the version in package.json — bump both together.',
    ).toBe(version);
  });

  it('CHANGELOG.md ships in the npm tarball', () => {
    // npm force-includes only package.json, the README and the licence. Anything
    // else has to be listed in `files` — and a changelog nobody installing from
    // npm can read is not much of a changelog.
    const files = JSON.parse(read('package.json')).files as string[];

    expect(
      files,
      "package.json `files` must list CHANGELOG.md, or it won't reach npm consumers.",
    ).toContain('CHANGELOG.md');
  });

  it('README documents every runtime export', () => {
    // `export type` lines are omitted on purpose: the README's API table is for
    // things you call or render, and TS types are visible in the editor anyway.
    const index = read('src/index.ts');
    const exported = [...index.matchAll(/^export \{([^}]+)\}/gm)]
      .filter((m) => !m[0].startsWith('export type'))
      .flatMap((m) => (m[1] ?? '').split(','))
      .map((name) => name.trim())
      .filter(Boolean);

    expect(exported.length).toBeGreaterThan(0);

    const readme = read('README.md');
    const undocumented = exported.filter((name) => !readme.includes(name));

    expect(
      undocumented,
      `These runtime exports are missing from the README's API table: ${undocumented.join(', ')}`,
    ).toEqual([]);
  });
});
