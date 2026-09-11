import { useEffect, useState } from 'react';
import { useStreami18nState } from '@stream-io/i18n/react';

import { Streami18n } from './Streami18n';
import type { TranslationContextValue } from './TranslationContext';
import type { LooseTranslationDictionary } from './types';

export type UseStreami18nParams = {
  /** An instance the integrator configured. One is created when absent. */
  i18nInstance?: Streami18n;
  /** The language the SDK's copy renders in. Changing it switches languages in place. */
  language?: string;
  /** Dictionaries to register, keyed by language code. Partial dictionaries are safe. */
  translations?: Record<string, LooseTranslationDictionary>;
};

/**
 * Resolves the translation context value: creates or adopts a {@link Streami18n} instance,
 * registers the supplied dictionaries, initializes it and keeps `t` fresh across language changes.
 *
 * `init()` and the store subscription belong to `useStreami18nState` in `@stream-io/i18n/react`,
 * shared with the web SDK.
 */
export const useStreami18n = ({
  i18nInstance,
  language,
  translations,
}: UseStreami18nParams): TranslationContextValue => {
  // Lazy `useState`, not `useMemo`: `new Streami18n()` is a real allocation with identity that must
  // survive a re-render, and this repo lints `react-hooks/purity` as an error — `useMemo` is a
  // cache React is free to drop, so constructing there is a purity violation. A later change to
  // `i18nInstance` is ignored on purpose; swapping the instance mid-tree is not a supported move.
  const [i18n] = useState(() => {
    const instance = i18nInstance ?? new Streami18n({ language });

    // Registered here rather than in an effect. `useStreami18nState` calls `init()` from its own
    // effect, which runs *before* any effect declared below it in this hook — so a dictionary
    // registered in an effect would arrive after i18next was already initialized, and the first
    // `init()` would warn that the language has no dictionary.
    if (translations) {
      for (const [code, dictionary] of Object.entries(translations)) {
        instance.registerTranslation(code, dictionary);
      }
    }

    return instance;
  });

  // No `onInitError` handler: core already logs a warning and leaves the instance usable, with `t`
  // still rendering each call site's inline English. Pass one only to surface init failures
  // somewhere other than the console.
  const translators = useStreami18nState(i18n);

  useEffect(() => {
    // Guarded on the current value: `setLanguage` re-runs the formatter factories and a full
    // i18next `changeLanguage`, and the first render already constructed the instance with
    // `language`. Undefined means "leave whatever the instance was configured with".
    if (!language || i18n.currentLanguage === language) return;
    i18n.setLanguage(language);
  }, [i18n, language]);

  // Returned as-is: `useStreami18nState` already caches this object and only produces a new one
  // when `t` or `tDateTimeParser` actually changes, so wrapping it in a `useMemo` would add a
  // second cache over a stable value.
  return translators;
};
