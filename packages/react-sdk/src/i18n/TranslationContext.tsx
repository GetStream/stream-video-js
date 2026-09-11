import {
  createDefaultTranslatorFunction,
  defaultDateTimeParser,
} from '@stream-io/i18n';
import { createTranslationContext } from '@stream-io/i18n/react';

import type { StreamTFunction, TDateTimeParser } from './types';

export type TranslationContextValue = {
  t: StreamTFunction;
  tDateTimeParser: TDateTimeParser;
};

/**
 * The `t` in force before i18next has initialized, and the context's default.
 *
 * Core's factory, instantiated against this SDK's catalog so it is typed exactly like the real `t`.
 * It honours the inline `defaultValue` each prose call site passes, which is what stops raw dotted
 * keys flashing on the first frame.
 */
const defaultTranslatorFunction =
  createDefaultTranslatorFunction() as StreamTFunction;

/**
 * Built from the shared factory in `@stream-io/i18n/react`.
 *
 * A **default value** is supplied rather than making the hook throw, and that is deliberate: it
 * matches what `useI18n` did before this module existed, and it is what lets the `embedded/`
 * components — which are used standalone, outside any provider — render correct English instead of
 * crashing. Chat's React Native SDK throws instead; hence core exposes this as a factory.
 */
const { TranslationContext, TranslationProvider, useTranslationContext } =
  createTranslationContext<TranslationContextValue>({
    defaultValue: {
      t: defaultTranslatorFunction,
      tDateTimeParser: defaultDateTimeParser,
    },
    displayName: 'StreamVideoTranslationContext',
  });

export { TranslationContext, TranslationProvider };

/**
 * Reads `t` and `tDateTimeParser` from the closest provider.
 *
 * Works outside a provider too — the default translator renders each call site's inline English.
 *
 * The name is `useI18n` rather than core's `useTranslationContext` because ~500 call sites in this
 * SDK already import it; renaming them is churn with no payoff.
 *
 * @example
 * const { t } = useI18n();
 * const label = t('callControls.cancelCallButton.leaveCall.title', 'Leave call');
 */
export const useI18n = useTranslationContext;
