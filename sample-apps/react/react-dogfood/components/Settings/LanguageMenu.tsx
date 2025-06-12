import { useCallback } from 'react';

import {
  DropDownSelect,
  DropDownSelectOption,
  TranslationLanguage,
} from '@stream-io/video-react-sdk';

const LANGUAGES: Record<TranslationLanguage, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
};

export type LanguageMenuProps = {
  language?: TranslationLanguage;
  setLanguage: (lng: string) => void;
};

export const LanguageMenu = ({
  language = 'en',
  setLanguage,
}: LanguageMenuProps) => {
  const handleSelect = useCallback(
    (index: number) => {
      const selected = Object.keys(LANGUAGES)[index];
      setLanguage(selected);
    },
    [setLanguage],
  );

  const languages = Object.entries(LANGUAGES);
  const index = languages.findIndex(([lngCode]) => lngCode === language);
  return (
    <DropDownSelect
      icon="language"
      defaultSelectedIndex={index}
      defaultSelectedLabel={LANGUAGES[language]}
      handleSelect={handleSelect}
    >
      {languages.map(([lngCode, languageName]) => (
        <DropDownSelectOption
          key={lngCode}
          label={languageName}
          icon="language"
        />
      ))}
    </DropDownSelect>
  );
};
