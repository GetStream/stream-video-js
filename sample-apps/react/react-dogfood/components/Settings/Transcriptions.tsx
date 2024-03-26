import { Fragment, useEffect, useState } from 'react';
import {
  DropDownSelect,
  DropDownSelectOption,
  TranscriptionSettingsRequestModeEnum,
  useCall,
} from '@stream-io/video-react-sdk';

const languages = [
  { code: null, label: 'None' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pl', label: 'Polish' },
  { code: 'ca', label: 'Catalan' },
  { code: 'cs', label: 'Czech' },
  { code: 'da', label: 'Danish' },
  { code: 'el', label: 'Greek' },
  { code: 'fi', label: 'Finnish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ru', label: 'Russian' },
  { code: 'sv', label: 'Swedish' },
  { code: 'ta', label: 'Tamil' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'ro', label: 'Romanian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tl', label: 'Filipino' },
  { code: 'he', label: 'Hebrew' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hr', label: 'Croatian' },
  { code: 'ko', label: 'Korean' },
  { code: 'ms', label: 'Malay' },
  { code: 'no', label: 'Norwegian' },
  { code: 'uk', label: 'Ukrainian' },
];

export const TranscriptionSettings = () => {
  const call = useCall();
  const [firstLanguage, setFirstLanguage] = useState<string | null>('en');
  const [secondLanguage, setSecondLanguage] = useState<string | null>(null);
  useEffect(() => {
    if (!call) return;
    call
      .update({
        settings_override: {
          transcription: {
            ...call.state.settings?.transcription,
            mode: TranscriptionSettingsRequestModeEnum.AUTO_ON,
            languages: [firstLanguage, secondLanguage].filter(
              Boolean,
            ) as string[],
          },
        },
      })
      .catch((err) => {
        console.error('Error updating call settings:', err);
      });
  }, [call, firstLanguage, secondLanguage]);

  return (
    <div className="rd__transcriptions">
      <h4>Primary language</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel="English"
        defaultSelectedIndex={1}
        handleSelect={(index) => setFirstLanguage(languages[index + 1].code)}
      >
        {languages.map((language) =>
          language.code ? (
            <DropDownSelectOption
              key={language.code}
              label={language.label}
              icon="language-sign"
            />
          ) : (
            <Fragment key="none" />
          ),
        )}
      </DropDownSelect>

      <h4>Secondary language</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel="None"
        defaultSelectedIndex={0}
        handleSelect={(index) => setSecondLanguage(languages[index].code)}
      >
        {languages.map((language) => (
          <DropDownSelectOption
            key={language.code || 'none'}
            label={language.label}
            icon="language-sign"
          />
        ))}
      </DropDownSelect>
    </div>
  );
};
