import { Fragment, ReactNode, useEffect, useState } from 'react';
import {
  DropDownSelect,
  DropDownSelectOption,
  TranscriptionSettingsRequestLanguageEnum,
  TranscriptionSettingsRequestModeEnum,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

const languages = [
  { code: undefined, label: 'None' },
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
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<
    string | undefined
  >('en');

  useEffect(() => {
    if (!call) return;
    const language = transcriptionLanguage
      ? // @ts-expect-error - TS doesn't know about the enum values
        TranscriptionSettingsRequestLanguageEnum[
          transcriptionLanguage.toUpperCase()
        ]
      : TranscriptionSettingsRequestLanguageEnum.AUTO;
    call
      .update({
        settings_override: {
          transcription: {
            ...call.state.settings?.transcription,
            mode: TranscriptionSettingsRequestModeEnum.AUTO_ON,
            language,
          },
        },
      })
      .catch((err) => {
        console.error('Error updating call settings:', err);
      });
  }, [call, transcriptionLanguage]);

  return (
    <div className="rd__transcriptions">
      <div className="str-video__call-stats">
        <div className="str-video__call-stats__card-container">
          <ClosedCaptionStatus />
          <TranscriptionStatus />
        </div>
      </div>

      <h4>Language</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel="English"
        defaultSelectedIndex={1}
        handleSelect={(index) =>
          setTranscriptionLanguage(languages[index + 1].code)
        }
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
    </div>
  );
};

const ClosedCaptionStatus = () => {
  const { t } = useI18n();
  const { useCallSettings, useIsCallCaptioningInProgress } =
    useCallStateHooks();
  const settings = useCallSettings();
  const inProgress = useIsCallCaptioningInProgress();

  return (
    <StatusCard
      label={t('Closed Captions')}
      value={settings?.transcription.closed_caption_mode}
      status={inProgress ? 'on' : 'off'}
    />
  );
};

const TranscriptionStatus = () => {
  const { t } = useI18n();
  const { useCallSettings, useIsCallTranscribingInProgress } =
    useCallStateHooks();
  const settings = useCallSettings();
  const inProgress = useIsCallTranscribingInProgress();

  return (
    <StatusCard
      label={t('Transcription')}
      value={settings?.transcription.closed_caption_mode}
      status={inProgress ? 'on' : 'off'}
    />
  );
};

const StatusCard = (props: {
  label: string;
  value: string | ReactNode;
  status?: 'on' | 'off';
}) => {
  const { t } = useI18n();
  const { label, value, status } = props;

  return (
    <div className="str-video__call-stats__card">
      <div className="str-video__call-stats__card-content">
        <div className="str-video__call-stats__card-label">{label}</div>
        <div className="str-video__call-stats__card-value">{value}</div>
      </div>
      {status && <StatusIndicator status={status}>{t(status)}</StatusIndicator>}
    </div>
  );
};

const StatusIndicator = (props: {
  children: ReactNode;
  status: 'on' | 'off';
}) => {
  const { children, status } = props;
  return (
    <div
      className={clsx('str-video__call-stats__tag', {
        'str-video__call-stats__tag--good': status === 'on',
        'str-video__call-stats__tag--bad': status === 'off',
      })}
    >
      <div className="str-video__call-stats__tag__text">{children}</div>
    </div>
  );
};
