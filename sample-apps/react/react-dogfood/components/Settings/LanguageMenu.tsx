import { useCallback } from 'react';

import { SettingsController } from './SettingsDialog';
import { Settings } from '../../context/SettingsContext';

import {
  TranslationLanguage,
  DropDownSelect,
  DefaultDropDownSelectOption,
} from '@stream-io/video-react-sdk';

const LANGUAGES: Record<TranslationLanguage, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
};

export type LanguageMenuProps = Pick<SettingsController, 'setLanguage'> &
  Pick<Settings, 'language'>;

export const LanguageMenu = ({ language, setLanguage }: LanguageMenuProps) => {
  const handleSelect = useCallback((index: number) => {
    const selected = Object.keys(LANGUAGES)[index];
    setLanguage(selected);
  }, []);

  return (
    <DropDownSelect
      icon="language"
      defaultSelectedIndex={0}
      defaultSelectedLabel="English"
      handleSelect={handleSelect}
    >
      {Object.entries(LANGUAGES).map(([lngCode, languageName]) => (
        <DefaultDropDownSelectOption
          key={`settings-language-${lngCode}`}
          label={languageName}
          icon="language"
        />
      ))}
    </DropDownSelect>
  );
};
