import {
  CallRecordingListItem,
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
import { DefaultAppHeader } from '../DefaultAppHeader';
import { getClient } from '../../helpers/client';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { useAppI18n } from '../../hooks/useAppI18n';
import { TranscriptionDownloadList } from '../TranscriptionDownloadList';

export const CallRecordingsPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language, fallbackLanguage },
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
      fallbackLanguage={fallbackLanguage}
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
            <TranscriptionDownloadList transcriptions={transcriptions} />
          </div>
        </>
      )}
    </>
  );
};
