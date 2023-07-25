export type TranslationLanguage = 'en' | string;

export type Namespace = string;

export type TranslationSheet = Record<string, string>;

export type TranslationsForLanguage = Record<Namespace, TranslationSheet>;

export type TranslationsMap = Record<TranslationLanguage, TranslationSheet>;

export type TranslationsRegistry = Record<
  TranslationLanguage | string,
  TranslationsForLanguage
>;

export type TranslatorFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;
