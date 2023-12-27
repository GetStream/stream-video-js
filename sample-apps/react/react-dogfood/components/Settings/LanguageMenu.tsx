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
  setLanguage: (lng: string) => void;
};

export const LanguageMenu = ({ setLanguage }: LanguageMenuProps) => {
  const handleSelect = useCallback(
    (index: number) => {
      const selected = Object.keys(LANGUAGES)[index];
      setLanguage(selected);
    },
    [setLanguage],
  );

  return (
    <DropDownSelect
      icon="language"
      defaultSelectedIndex={0}
      defaultSelectedLabel="English"
      handleSelect={handleSelect}
    >
      {Object.entries(LANGUAGES).map(([lngCode, languageName]) => (
        <DropDownSelectOption
          key={lngCode}
          label={languageName}
          icon="language"
        />
      ))}
    </DropDownSelect>
  );
};
