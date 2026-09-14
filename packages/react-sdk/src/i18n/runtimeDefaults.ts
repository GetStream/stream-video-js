/**
 * The SDK's bundled translation data: the keys that cannot carry an inline `defaultValue` at their
 * call site. `Streami18n` layers it under *every* language, so a partial dictionary never knocks
 * these out.
 *
 * Empty, and that is the intended steady state. The four lookups this SDK resolved from a runtime
 * value — the only candidates for an entry here — are written as `switch` statements over literal
 * `t()` calls instead, so every branch carries its own English copy inline and the codegen reads it
 * straight off the call site. Nothing is left without a default. `timestamp.*` / `duration.*`
 * formatter expressions would also live here; this SDK has none yet.
 *
 * Adding an entry later needs no wiring. `Streami18n` already spreads this into the core options and
 * `scripts/generate-i18n-keys.mts` already reads this path, so a new key reaches `keys.ts` on the
 * next `build-translations` run — where a key nothing references, or one that shadows an inline
 * default, fails a codegen guard.
 */
export const runtimeDefaults = {};
