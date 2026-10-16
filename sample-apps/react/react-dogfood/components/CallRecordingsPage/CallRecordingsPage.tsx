import {
  CallRecordingListItem,
  Icon,
  LoadingIndicator,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import {
  CallRecordingSearchForm,
  CallRecordingSearchResult,
} from './CallRecordingSearchForm';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { useSettings } from '../../context/SettingsContext';
import { appTranslations } from '../../translations';
import { DefaultAppHeader } from '../DefaultAppHeader';
import { getClient } from '../../helpers/client';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { useAppI18n } from '../../hooks/useAppI18n';

export const CallRecordingsPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language },
  } = useSettings();
  const [result, setResult] = useState<CallRecordingSearchResult | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(false);
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const environment = useAppEnvironment();

  useEffect(() => {
    const _client = getClient({ apiKey, user, userToken }, environment);
    setVideoClient(_client);

    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error(`Couldn't disconnect user`, e));
      setVideoClient(undefined);
    };
  }, [apiKey, environment, user, userToken]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo
      client={videoClient}
      language={language}
      translations={appTranslations}
    >
      <DefaultAppHeader />
      <div className="rd__call-recordings-page">
        <div className="rd__call-recordings-page__container">
          <CallRecordingSearchForm
            setResult={setResult}
            setResultError={setError}
            setLoading={setLoading}
          />
          {loading ? (
            <LoadingIndicator />
          ) : error?.message ? (
            <div>{error.message}</div>
          ) : (
            result && <CallRecordingSearchResults result={result} />
          )}
        </div>
      </div>
    </StreamVideo>
  );
};

/**
 * The CDN serves files cross-origin without `Content-Disposition`, so the
 * anchor's `download` attribute is ignored and the browser would just display
 * the file. Saving it through a same-origin blob URL forces a download.
 */
const downloadFile = async (url: string, filename: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blobUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};

const CallRecordingSearchResults = ({
  result: { recordings, transcriptions },
}: {
  result: CallRecordingSearchResult;
}) => {
  const { t } = useAppI18n();
  return (
    <>
      <div className="rd__call-recordings-page__recordings-list">
        {recordings.length
          ? recordings.map((recording) => (
              <CallRecordingListItem
                recording={recording}
                key={recording.filename}
              />
            ))
          : 'No recordings found for the call'}
      </div>
      {transcriptions.length > 0 && (
        <>
          <h4>{t('recordings.transcriptions.title', 'Transcripts')}</h4>
          <div className="rd__call-recordings-page__recordings-list">
            {transcriptions.map(({ filename, url }) => (
              <div
                className="str-video__call-recording-list__item"
                key={filename}
              >
                <div className="str-video__call-recording-list__filename rd__call-recordings-page__transcript-filename">
                  {filename}
                </div>
                <div className="str-video__call-recording-list__download">
                  <a
                    className="str-video__call-recording-list-item__action-button str-video__call-recording-list-item__action-button--download"
                    role="button"
                    href={url}
                    download={filename}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadFile(url, filename).catch((err) => {
                        console.warn('Failed to download transcript', err);
                        window.open(url, '_blank');
                      });
                    }}
                    title={t(
                      'recordings.transcriptions.download.title',
                      'Download the transcript',
                    )}
                  >
                    <Icon icon="download" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};
