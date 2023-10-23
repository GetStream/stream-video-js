import { TranslationsMap, TranslationsRegistry } from './types';

export const mapToRegistry = (
  translationsMap: TranslationsMap,
  namespace: string,
) =>
  Object.entries(translationsMap).reduce((acc, [lng, translations]) => {
    acc[lng] = { [namespace]: translations };
    return acc;
  }, {} as TranslationsRegistry);
