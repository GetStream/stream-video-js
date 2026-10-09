import { Streami18n as CoreStreami18n } from '@stream-io/i18n';
import type { Streami18nOptions as CoreStreami18nOptions } from '@stream-io/i18n';

import { runtimeDefaults } from './runtimeDefaults';
import type { BundledKey, TranslationCatalog } from './types';

/**
 * Options for {@link Streami18n}.
 *
 * Core's options, narrowed to this SDK's catalog so `translationsForLanguage` is key-checked.
 * `runtimeDefaults` is *merged* over the SDK's own rather than replacing it, so supplying it adds to
 * what the SDK ships.
 */
export type Streami18nOptions = CoreStreami18nOptions<TranslationCatalog>;

/**
 * Wrapper around [i18next](https://www.i18next.com/) for this SDK's translations. Pass an instance
 * to `<StreamVideo i18nInstance={…}>` to control the language and the copy.
 *
 * The implementation lives in `@stream-io/i18n`, shared with the web SDK and with Chat. This
 * subclass exists even though {@link runtimeDefaults} is currently empty: its job is to bind the
 * two type parameters, so `new Streami18n()` and its `t` are checked against *this* package's
 * catalog rather than against core's `Record<string, string>` fallback, which would accept any key.
 *
 * ## Overriding some of the English copy
 *
 * ```ts
 * const i18n = new Streami18n({
 *   translationsForLanguage: {
 *     'common.you.label': 'Jij',
 *   },
 * });
 * ```
 *
 * ## Adding a language
 *
 * ```ts
 * import 'dayjs/locale/nl';
 *
 * const i18n = new Streami18n({ language: 'nl' });
 * i18n.registerTranslation('nl', {
 *   'common.join.label': 'Deelnemen',
 * });
 * ```
 *
 * No dayjs locale file defines `calendar` — that field belongs to the calendar plugin — so a
 * language whose relative dates must read natively needs the locale import *and* a `calendar`
 * config passed as the third argument.
 *
 * Type your dictionary as `TranslationDictionary` to turn a typo or a key removed in a later major
 * into a compile error. A **partial dictionary is safe**: any key you leave out renders the English
 * copy that ships inline at each call site, never a raw dotted path — so there is no need to
 * translate everything before shipping a language.
 *
 * Hermes ships a partial ICU, so `Intl.PluralRules` has no data for most locales and every count
 * would select the `_other` form. Import `intl-pluralrules` before anything else in your entry
 * file; core warns when it is missing.
 *
 * Reactivity goes through `i18n.state`, a `StateStore`. `setLanguage()` returns nothing — the new
 * `t` is published to that store, which the provider subscribes to.
 */
export class Streami18n extends CoreStreami18n<TranslationCatalog, BundledKey> {
  constructor(options: Streami18nOptions = {}) {
    super({
      ...options,
      // Merged, not replaced. Spreading `options` over a literal would let an integrator supplying
      // one entry silently drop the SDK's own bundled data, which then renders as raw keys.
      runtimeDefaults: { ...runtimeDefaults, ...options.runtimeDefaults },
    });
  }
}
