import { Fragment, ReactNode, useEffect, useState } from 'react';
import {
  asDynamicKey,
  DropDownSelect,
  DropDownSelectOption,
  TranscriptionSettingsRequestLanguageEnum,
  TranscriptionSettingsRequestModeEnum,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { useAppI18n } from '../../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

/**
 * The transcription languages the backend accepts, in the order the dropdown lists them. The
 * leading entry with no code is the "auto" slot the dropdown skips while rendering.
 *
 * The names are not here: the list is driven by the API, so the key can only be built at runtime.
 * See `languageLabel` below.
 */
const languages: { code?: string }[] = [
  { code: undefined },
  { code: 'en' },
  { code: 'fr' },
  { code: 'es' },
  { code: 'de' },
  { code: 'it' },
  { code: 'nl' },
  { code: 'pt' },
  { code: 'pl' },
  { code: 'ca' },
  { code: 'cs' },
  { code: 'da' },
  { code: 'el' },
  { code: 'fi' },
  { code: 'id' },
  { code: 'ja' },
  { code: 'ru' },
  { code: 'sv' },
  { code: 'ta' },
  { code: 'th' },
  { code: 'tr' },
  { code: 'hu' },
  { code: 'ro' },
  { code: 'zh' },
  { code: 'ar' },
  { code: 'tl' },
  { code: 'he' },
  { code: 'hi' },
  { code: 'hr' },
  { code: 'ko' },
  { code: 'ms' },
  { code: 'no' },
  { code: 'uk' },
];

const DEFAULT_TRANSCRIPTION_LANGUAGE = 'en';

/**
 * The one place in this app where a translation key is built from a runtime value, and so the one
 * `asDynamicKey`. The English for `language.*` lives in `i18n/runtimeDefaults.ts`; every other
 * lookup that used to work this way is now a `switch` over literal `t()` calls.
 */
const languageLabel = (t: LooseTranslateFunction, code: string) =>
  t(asDynamicKey(`language.${code}`));

export const TranscriptionSettings = () => {
  const call = useCall();
  const { t } = useAppI18n();
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

      <h4>{t('common.language.label', 'Language')}</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel={languageLabel(t, DEFAULT_TRANSCRIPTION_LANGUAGE)}
        defaultSelectedIndex={1}
        handleSelect={(index) =>
          setTranscriptionLanguage(languages[index + 1].code)
        }
      >
        {languages.map((language) =>
          language.code ? (
            <DropDownSelectOption
              key={language.code}
              label={languageLabel(t, language.code)}
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
  const { t } = useAppI18n();
  const { useCallSettings, useIsCallCaptioningInProgress } =
    useCallStateHooks();
  const settings = useCallSettings();
  const inProgress = useIsCallCaptioningInProgress();

  return (
    <StatusCard
      label={t('common.closedCaptions.label', 'Closed Captions')}
      value={settings?.transcription.closed_caption_mode}
      status={inProgress ? 'on' : 'off'}
    />
  );
};

const TranscriptionStatus = () => {
  const { t } = useAppI18n();
  const { useCallSettings, useIsCallTranscribingInProgress } =
    useCallStateHooks();
  const settings = useCallSettings();
  const inProgress = useIsCallTranscribingInProgress();

  return (
    <StatusCard
      label={t('settings.transcription.label', 'Transcription')}
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
  const { t } = useAppI18n();
  const { label, value, status } = props;

  return (
    <div className="str-video__call-stats__card">
      <div className="str-video__call-stats__card-content">
        <div className="str-video__call-stats__card-label">{label}</div>
        <div className="str-video__call-stats__card-value">{value}</div>
      </div>
      {status && (
        <StatusIndicator status={status}>
          {status === 'on'
            ? t('common.status.on.label', 'on')
            : t('common.status.off.label', 'off')}
        </StatusIndicator>
      )}
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
