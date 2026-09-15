// Hermes ships a partial ICU, so `Intl.PluralRules` silently falls back to root rules and `_one`
// never selects — the plural assertions below would pass vacuously. The SDK entry point imports this
// for the same reason, but this test does not go through the entry point, so it must import it itself.
import 'intl-pluralrules';

import { Streami18n } from '../../src/i18n/Streami18n';
import catalog from './catalog.fixture.json';

/**
 * Renders every key in the shipped catalog and asserts none of them surfaces as its own dotted path.
 *
 * This is the net for the one failure mode the codegen cannot catch statically: the generator proves a
 * key *has* copy somewhere, but only actually resolving it through i18next proves the copy comes out.
 * A key whose bundled value went missing, whose plural forms do not cover the categories it is called
 * with, or whose interpolation names do not match what the call site passes, all render as a raw key or
 * with a literal `{{ placeholder }}` — visible to a user, invisible to types.
 *
 * `keys.ts` is type-only, so a test cannot iterate it. `catalog.fixture.json` is its data twin, emitted
 * by the same generator run. It lives here rather than under `src/` because this package's tsconfig is
 * `{"include": ["src"]}` with no `exclude`, so builder-bob would otherwise compile and ship it.
 */
const DOTTED_KEY = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$/;

/** The leaf segment names the kind of copy. Kept closed so a new one is a deliberate decision. */
const LEAF =
  /^(?:label|ariaLabel|placeholder|title|description|text)(?:_(?:zero|one|two|few|many|other))?$/;

const SEGMENT = /^[a-zA-Z0-9]+$/;

const PLURAL_SUFFIX = /_(?:zero|one|two|few|many|other)$/;

/**
 * Values for whichever variables a key's own copy declares.
 *
 * Derived from the copy rather than a fixed list, so a leftover `{{ placeholder }}` means i18next
 * genuinely failed to interpolate something it was handed — not merely that this test forgot a name.
 * `{{ x | formatter(...) }}` and `{{ x, formatter }}` both name the variable first.
 */
const interpolationValuesFor = (copy: string) => {
  const values: Record<string, unknown> = {
    count: 2,
    milliseconds: 60_000,
    timestamp: '2026-03-13T14:32:00.000Z',
  };
  for (const match of copy.matchAll(/\{\{([^}]*)\}\}/g)) {
    const name = (match[1] ?? '').split(/[|,]/)[0]?.trim();
    if (name && !(name in values)) values[name] = 'x';
  }
  return values;
};

const entries = Object.entries(catalog as Record<string, string>);

/**
 * Left as `string | undefined` on purpose: the plural block asks for `_few` / `_many` forms English
 * does not have, and `undefined` is what tells i18next there is no default for that category.
 * Coercing to `''` there would hand it an empty default instead.
 */
const catalogOf = (key: string): string | undefined =>
  (catalog as Record<string, string>)[key];

const copyOf = (key: string) => catalogOf(key) ?? '';

/** Plural entries live as `<key>_one` / `<key>_other`; call sites use the bare handle plus `count`. */
const pluralBases = [
  ...new Set(
    entries
      .map(([key]) => key.match(/^(.*)_(?:zero|one|two|few|many|other)$/)?.[1])
      .filter((base): base is string => Boolean(base)),
  ),
];

const singularKeys = entries
  .map(([key]) => key)
  .filter((key) => !PLURAL_SUFFIX.test(key));

type Render = (
  key: string,
  d?: string | Record<string, unknown>,
  o?: Record<string, unknown>,
) => string;

const translator = async () => {
  const { t } = await new Streami18n({ logger: () => {} }).init();
  return t as unknown as Render;
};

describe('translation catalog renders', () => {
  it('has entries to check', () => {
    expect(entries.length).toBeGreaterThan(25);
    expect(pluralBases.length).toBeGreaterThan(0);
  });

  it('names every key as <area>.<...>.<leaf> with a known leaf', () => {
    const offenders: string[] = [];
    for (const [key] of entries) {
      const segments = key.split('.');
      if (segments.length < 3 || segments.length > 4) {
        offenders.push(
          `${key} has ${segments.length} segments, expected 3 or 4`,
        );
        continue;
      }
      if (!segments.slice(0, -1).every((segment) => SEGMENT.test(segment))) {
        offenders.push(`${key} has a non-alphanumeric segment`);
      }
      if (!LEAF.test(segments.at(-1) ?? '')) {
        offenders.push(`${key} ends in an unknown leaf`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('renders every singular key without leaking the key or a placeholder', async () => {
    const render = await translator();

    const offenders: string[] = [];
    for (const key of singularKeys) {
      // The catalog's own copy is passed as the inline default, because that is where prose copy comes
      // from at runtime — only `runtimeDefaults` keys resolve from a bundled resource. What this proves
      // is that the declared copy actually renders: interpolation names line up, and a bundled key is
      // not missing.
      const rendered = render(
        key,
        copyOf(key),
        interpolationValuesFor(copyOf(key)),
      );
      if (!rendered || rendered === key || DOTTED_KEY.test(rendered)) {
        offenders.push(`${key} -> ${JSON.stringify(rendered)}`);
      } else if (rendered.includes('{{')) {
        offenders.push(
          `${key} left a placeholder -> ${JSON.stringify(rendered)}`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  it('renders every plural key at each count without leaking the key or a placeholder', async () => {
    const render = await translator();

    const offenders: string[] = [];
    for (const base of pluralBases) {
      const forms = [
        `${base}_one`,
        `${base}_other`,
        `${base}_few`,
        `${base}_many`,
      ]
        .map(catalogOf)
        .filter(Boolean)
        .join(' ');
      const renderAt = (count: number) =>
        render(base, {
          ...interpolationValuesFor(forms),
          count,
          defaultValue_one: catalogOf(`${base}_one`),
          defaultValue_other: catalogOf(`${base}_other`),
        });

      for (const count of [0, 1, 2, 5]) {
        const rendered = renderAt(count);
        if (!rendered || rendered === base || DOTTED_KEY.test(rendered)) {
          offenders.push(`${base} @ ${count} -> ${JSON.stringify(rendered)}`);
        } else if (rendered.includes('{{')) {
          offenders.push(
            `${base} @ ${count} left a placeholder -> ${JSON.stringify(rendered)}`,
          );
        }
      }

      // This is what the `intl-pluralrules` import at the top of the file buys. Without it Hermes'
      // partial ICU answers `_other` for every count, and every assertion above would still pass.
      // English selects `_one` only at 1, so two distinct forms must render two distinct strings.
      if (
        catalogOf(`${base}_one`) !== catalogOf(`${base}_other`) &&
        renderAt(1) === renderAt(2)
      ) {
        offenders.push(
          `${base} renders the same string at 1 and 2 -> ${JSON.stringify(renderAt(1))}`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * Guarantee G2 of the shared runtime, and the headline behaviour change of the migration: a
   * dictionary that covers one key translates that key and leaves every other one rendering its
   * English copy — never a dotted path. Before the migration a partial dictionary knocked out the
   * keys it omitted.
   */
  it('renders English for keys a partial dictionary omits', async () => {
    const translated = 'common.join.label';
    const omitted = 'common.you.label';

    const i18n = new Streami18n({ logger: () => {} });
    await i18n.init();
    i18n.registerTranslation('de', { [translated]: 'Beitreten' });
    await i18n.setLanguage('de');

    const render = i18n.t as unknown as Render;

    expect(render(translated, copyOf(translated))).toBe('Beitreten');

    const fallback = render(omitted, copyOf(omitted));
    expect(fallback).toBe(copyOf(omitted));
    expect(DOTTED_KEY.test(fallback)).toBe(false);
  });
});
