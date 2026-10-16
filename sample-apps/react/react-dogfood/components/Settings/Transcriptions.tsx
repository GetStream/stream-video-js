import { Fragment, ReactNode, useEffect, useState } from 'react';
import {
  CallTranscription,
  DropDownSelect,
  DropDownSelectOption,
  OwnCapability,
  TranscriptionSettingsRequestLanguageEnum,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { TranscriptionDownloadList } from '../TranscriptionDownloadList';
import { useAppI18n } from '../../hooks/useAppI18n';

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

const DEFAULT_TRANSCRIPTION_LANGUAGE = 'en';

export const TranscriptionSettings = () => {
  const call = useCall();
  const { t } = useI18n();
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  const currentLanguage = settings?.transcription.language;
  const selectedLanguage =
    currentLanguage && currentLanguage !== 'auto'
      ? currentLanguage
      : DEFAULT_TRANSCRIPTION_LANGUAGE;
  const selectedIndex = languages.findIndex(
    ({ code }) => code === selectedLanguage,
  );

  const updateLanguage = (code: string | undefined) => {
    if (!call) return;
    const language = code
      ? // @ts-expect-error - TS doesn't know about the enum values
        TranscriptionSettingsRequestLanguageEnum[code.toUpperCase()]
      : TranscriptionSettingsRequestLanguageEnum.AUTO;
    call
      .update({
        settings_override: {
          transcription: { ...call.state.settings?.transcription, language },
        },
      })
      .catch((err) => {
        console.error('Error updating call settings:', err);
      });
  };

  return (
    <div className="rd__transcriptions">
      <div className="str-video__call-stats">
        <div className="str-video__call-stats__card-container">
          <ClosedCaptionStatus />
          <TranscriptionStatus />
        </div>
      </div>
      <TranscriptionControls />

      <h4>{t('Language')}</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel={t(languages[selectedIndex]?.label ?? 'English')}
        defaultSelectedIndex={Math.max(selectedIndex - 1, 0)}
        handleSelect={(index) => updateLanguage(languages[index + 1].code)}
      >
        {languages.map((language) =>
          language.code ? (
            <DropDownSelectOption
              key={language.code}
              label={t(language.label)}
              icon="language-sign"
            />
          ) : (
            <Fragment key="none" />
          ),
        )}
      </DropDownSelect>

      <TranscriptionDownloads />
    </div>
  );
};

const TranscriptionControls = () => {
  const call = useCall();
  const { t } = useAppI18n();
  const {
    useCallSettings,
    useIsCallTranscribingInProgress,
    useHasPermissions,
  } = useCallStateHooks();
  const settings = useCallSettings();
  const isTranscribing = useIsCallTranscribingInProgress();
  const canStart = useHasPermissions(OwnCapability.START_TRANSCRIPTION_CALL);
  const canStop = useHasPermissions(OwnCapability.STOP_TRANSCRIPTION_CALL);
  const [pending, setPending] = useState(false);

  if (settings?.transcription.mode === 'disabled') {
    return (
      <p className="rd__transcriptions__hint">
        {t(
          'settings.transcription.disabled.text',
          'Transcription is disabled for this call type.',
        )}
      </p>
    );
  }
  if (!canStart && !canStop) return null;

  const toggleTranscription = async () => {
    if (!call) return;
    setPending(true);
    try {
      if (isTranscribing) {
        await call.stopTranscription();
      } else {
        await call.startTranscription();
      }
      // the backend doesn't always emit transcription_started/stopped
      // (e.g. while closed captions are running), so re-sync the call state
      await call.get();
    } catch (err) {
      console.error('Failed to toggle transcription', err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rd__transcriptions__controls">
      <button
        type="button"
        className={`rd__button ${isTranscribing ? 'rd__button--secondary' : 'rd__button--primary'}`}
        disabled={pending || (isTranscribing ? !canStop : !canStart)}
        onClick={toggleTranscription}
      >
        {isTranscribing
          ? t('settings.transcription.stop.label', 'Stop transcription')
          : t('settings.transcription.start.label', 'Start transcription')}
      </button>
    </div>
  );
};

const TranscriptionDownloads = () => {
  const call = useCall();
  const { t } = useAppI18n();
  const [transcriptions, setTranscriptions] = useState<CallTranscription[]>([]);

  useEffect(() => {
    if (!call) return;
    const addTranscriptions = (added: CallTranscription[]) =>
      setTranscriptions((prev) => [
        ...prev,
        ...added.filter((a) => !prev.some((p) => p.filename === a.filename)),
      ]);
    call
      .listTranscriptions()
      .then(({ transcriptions: listed }) => addTranscriptions(listed))
      .catch((err) => console.warn('Failed to list transcriptions', err));
    return call.on('call.transcription_ready', (e) =>
      addTranscriptions([e.call_transcription]),
    );
  }, [call]);

  return (
    <>
      <h4>{t('recordings.transcriptions.title', 'Transcripts')}</h4>
      {transcriptions.length ? (
        <TranscriptionDownloadList transcriptions={transcriptions} />
      ) : (
        <p className="rd__transcriptions__hint">
          {t(
            'settings.transcription.downloads.empty.text',
            'No transcripts yet. They show up here once a transcription stops.',
          )}
        </p>
      )}
    </>
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
