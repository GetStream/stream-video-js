import type {
  Streami18nState as CoreStreami18nState,
  LooseTranslationDictionaryOf,
  RelativeTimeCatalog,
  StreamTFunctionFor,
  TranslationDictionaryOf,
  TranslationKeyOf,
} from '@stream-io/i18n';

import type { TranslationCatalog as GeneratedCatalog } from './keys';

/**
 * The SDK's i18n types, instantiated from the generic helpers in `@stream-io/i18n`.
 *
 * The derivations live in core so both video SDKs (and Chat) share one implementation; the *catalog*
 * stays here, because it is generated from this package's own `t()` call sites — which are not the
 * web SDK's. That split is why core's helpers are generic over the catalog rather than driven by
 * module augmentation: two catalogs have to be able to coexist in one TypeScript program, which a
 * monorepo typechecking the web and React Native SDKs in one pass does.
 *
 * `relativeTime.*` is intersected in because it is core's copy, not ours: `timestampFormatter`
 * renders "Today" / "3d ago" through `t()`, and without these keys in the catalog an integrator
 * could not type a dictionary that translates them.
 */
export type TranslationCatalog = GeneratedCatalog & RelativeTimeCatalog;

/**
 * Keys resolved from bundled data rather than from an inline `defaultValue`.
 *
 * `never`, because `runtimeDefaults.ts` is empty — every key this SDK uses is written literally
 * with its English copy at the call site. `timestamp.*` / `duration.*` are matched by prefix inside
 * core and need no entry here.
 *
 * **It must never become `string`.** `string` collapses the prose overload in `StreamTFunctionFor`,
 * which silently disables all key checking: every `t('typo.key', 'copy')` would compile. Widen it
 * only to a literal prefix template (`` `foo.${string}` ``) when a real bundled key appears.
 */
export type BundledKey = never;

export type TranslationKey = TranslationKeyOf<TranslationCatalog>;
export type TranslationDictionary = TranslationDictionaryOf<TranslationCatalog>;
export type LooseTranslationDictionary =
  LooseTranslationDictionaryOf<TranslationCatalog>;
export type StreamTFunction = StreamTFunctionFor<
  TranslationCatalog,
  BundledKey
>;

/**
 * The value held by `Streami18n.state`, parameterized for this SDK's catalog.
 *
 * Exported because `state` is public: a consumer subscribing to it needs to name the type for a
 * module-scope selector. Core's default-parameterized `Streami18nState` is not a substitute — `t` is
 * contravariant in its key parameter, so that one is not assignable to this.
 */
export type Streami18nState = CoreStreami18nState<
  TranslationCatalog,
  BundledKey
>;

/**
 * Re-exported so an integrator can type a formatter, a locale config or a date parser without
 * taking a direct dependency on `@stream-io/i18n`.
 */
export type {
  CustomFormatters,
  DateTimeParserModule,
  DayjsLocaleConfig,
  DurationFormatterOptions,
  DynamicTranslationKey,
  FormatterFactory,
  LooseTranslateFunction,
  PredefinedFormatters,
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from '@stream-io/i18n';
