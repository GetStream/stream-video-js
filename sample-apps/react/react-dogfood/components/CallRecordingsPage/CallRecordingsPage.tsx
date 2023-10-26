import {
  CallRecording,
  CallRecordingListItem,
  LoadingIndicator,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { CallRecordingSearchForm } from './CallRecordingSearchForm';
import { LobbyHeader } from '../LobbyHeader';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { useSettings } from '../../context/SettingsContext';
import { customSentryLogger } from '../../helpers/logger';

export const CallRecordingsPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language },
  } = useSettings();
  const [recordings, setRecordings] = useState<CallRecording[] | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(false);
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token: userToken,
      options: { logLevel: 'info', logger: customSentryLogger },
    });
    setVideoClient(_client);

    // @ts-ignore - for debugging
    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error(`Couldn't disconnect user`, e));
      setVideoClient(undefined);
    };
  }, [apiKey, user, userToken]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo client={videoClient} language={language}>
      <LobbyHeader />
      <Box display="flex" justifyContent="center">
        <Box display="flex" alignItems="center" flexDirection="column">
          <CallRecordingSearchForm
            setResult={setRecordings}
            setResultError={setError}
            setLoading={setLoading}
          />
          {loading ? (
            <LoadingIndicator className="rd__call-recording__loading-indicator" />
          ) : error?.message ? (
            <div>{error.message}</div>
          ) : (
            <Box
              maxHeight="400px"
              maxWidth="400px"
              overflow={'hidden auto'}
              paddingBottom="0.5rem"
              width="100%"
              textAlign="center"
            >
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
            </Box>
          )}
        </Box>
      </Box>
    </StreamVideo>
  );
};
