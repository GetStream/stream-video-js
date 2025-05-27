export type TranslationLanguage = 'en' | (string & {});

export type TranslationSheet = Record<string, string>;

export type TranslationsMap = Record<TranslationLanguage, TranslationSheet>;

export type TranslatorFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;
