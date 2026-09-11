import type { LooseTranslationDictionary } from '@stream-io/video-react-sdk';

import { runtimeDefaults } from '../i18n/runtimeDefaults';

import appDe from './app/de.json';
import appEs from './app/es.json';
import sdkDe from './sdk/de.json';
import sdkEs from './sdk/es.json';

/**
 * The dictionaries handed to `<StreamVideo translations={...}>`.
 *
 * Split by owner: `sdk/` holds keys from `@stream-io/video-react-sdk`'s catalog, `app/` holds this
 * app's own. Nothing is spread in from the SDK any more — it no longer ships a `translations`
 * export, and English now comes from the inline copy at each `t()` call site, so there is no `en`
 * dictionary here beyond the runtime defaults.
 *
 * `runtimeDefaults` goes under every language: those keys are built from a runtime value and carry
 * no inline default, and `fallbackLng` is off in the shared runtime.
 */
export const appTranslations: Record<string, LooseTranslationDictionary> = {
  en: { ...runtimeDefaults },
  de: { ...runtimeDefaults, ...sdkDe, ...appDe },
  es: { ...runtimeDefaults, ...sdkEs, ...appEs },
};

export default appTranslations;
