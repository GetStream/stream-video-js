import {
  CallRecording,
  CallRecordingListItem,
  LoadingIndicator,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import { CallRecordingSearchForm } from './CallRecordingSearchForm';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { useSettings } from '../../context/SettingsContext';
import { DefaultAppHeader } from '../DefaultAppHeader';
import { getClient } from '../../helpers/client';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';

export const CallRecordingsPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language, fallbackLanguage },
  } = useSettings();
  const [recordings, setRecordings] = useState<CallRecording[] | undefined>();
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
            setResult={setRecordings}
            setResultError={setError}
            setLoading={setLoading}
          />
          {loading ? (
            <LoadingIndicator />
          ) : error?.message ? (
            <div>{error.message}</div>
          ) : (
            <div className="rd__call-recordings-page__recordings-list">
              {!recordings
                ? null
                : recordings.length
                  ? recordings.map((recording) => (
                      <CallRecordingListItem
                        recording={recording}
                        key={recording.filename}
                      />
                    ))
                  : 'No recordings found for the call'}
            </div>
          )}
        </div>
      </div>
    </StreamVideo>
  );
};
