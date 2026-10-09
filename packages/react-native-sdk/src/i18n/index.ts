export * from './Streami18n';
export * from './TranslationContext';
export * from './types';
export * from './useStreami18n';

/**
 * Core helpers re-exported so an integrator never needs a direct dependency on `@stream-io/i18n`:
 * that package is an implementation detail of this SDK, and a second copy resolved from their
 * `node_modules` would register dayjs plugins on the wrong module.
 *
 * - `asDynamicKey` — brands a runtime-resolved string as a translation key, the one sanctioned way
 *   past the compile-time key check.
 * - `getDateString` — the timestamp renderer, for a custom component formatting dates itself.
 * - `predefinedFormatters` — the built-in i18next formatters, to spread over when adding one.
 * - `defaultDateTimeParser` — the dayjs-backed parser, with the required plugins already applied.
 */
export {
  asDynamicKey,
  defaultDateTimeParser,
  getDateString,
  predefinedFormatters,
} from '@stream-io/i18n';
