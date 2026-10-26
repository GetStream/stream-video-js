import { Fragment, ReactNode, useEffect, useState } from 'react';
import {
  asDynamicKey,
  CallTranscription,
  DropDownSelect,
  DropDownSelectOption,
  OwnCapability,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { StatCard, StatCardGrid, StatCardTag } from '../StatCard';
import { TranscriptionDownloadList } from '../TranscriptionDownloadList';
import { useAppI18n } from '../../hooks/useAppI18n';
import type {
  LooseTranslateFunction,
  TranscriptionSettingsRequest,
} from '@stream-io/video-react-sdk';

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
    const language = (code ??
      'auto') as TranscriptionSettingsRequest['language'];
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
    <div>
      <div className="rd__transcriptions__status">
        <StatCardGrid>
          <ClosedCaptionStatus />
          <TranscriptionStatus />
        </StatCardGrid>
      </div>
      <TranscriptionControls />

      <h4>{t('common.language.label', 'Language')}</h4>
      <DropDownSelect
        icon="language-sign"
        defaultSelectedLabel={languageLabel(t, selectedLanguage)}
        defaultSelectedIndex={Math.max(selectedIndex - 1, 0)}
        handleSelect={(index) => updateLanguage(languages[index + 1].code)}
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
      value={settings?.transcription.mode}
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
    <StatCard
      label={label}
      value={value}
      tag={
        status && (
          <StatCardTag variant={status === 'on' ? 'good' : 'bad'}>
            {status === 'on'
              ? t('common.status.on.label', 'on')
              : t('common.status.off.label', 'off')}
          </StatCardTag>
        )
      }
    />
  );
};
