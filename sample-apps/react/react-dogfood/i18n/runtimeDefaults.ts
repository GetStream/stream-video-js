/**
 * The app's bundled translation data: the keys that cannot carry an inline `defaultValue` at their
 * call site.
 *
 * Exactly one block lives here. `components/Settings/Transcriptions.tsx` renders the transcription
 * language list from the codes the API accepts, so the key is built from a runtime value and there
 * is nowhere to write the English inline — see the single `asDynamicKey` in the app. Every other
 * runtime-keyed lookup in this app was rewritten as literal `t()` calls instead.
 *
 * `translations/index.ts` layers this under *every* language, the same way `Streami18n` layers the
 * SDK's own `runtimeDefaults`: `fallbackLng` is off, so a language whose dictionary omits a
 * `language.*` entry would otherwise render the raw dotted key.
 */
export const runtimeDefaults = {
  'language.ar': 'Arabic',
  'language.ca': 'Catalan',
  'language.cs': 'Czech',
  'language.da': 'Danish',
  'language.de': 'German',
  'language.el': 'Greek',
  'language.en': 'English',
  'language.es': 'Spanish',
  'language.fi': 'Finnish',
  'language.fr': 'French',
  'language.he': 'Hebrew',
  'language.hi': 'Hindi',
  'language.hr': 'Croatian',
  'language.hu': 'Hungarian',
  'language.id': 'Indonesian',
  'language.it': 'Italian',
  'language.ja': 'Japanese',
  'language.ko': 'Korean',
  'language.ms': 'Malay',
  'language.nl': 'Dutch',
  'language.no': 'Norwegian',
  'language.pl': 'Polish',
  'language.pt': 'Portuguese',
  'language.ro': 'Romanian',
  'language.ru': 'Russian',
  'language.sv': 'Swedish',
  'language.ta': 'Tamil',
  'language.th': 'Thai',
  'language.tl': 'Filipino',
  'language.tr': 'Turkish',
  'language.uk': 'Ukrainian',
  'language.zh': 'Chinese',
};
