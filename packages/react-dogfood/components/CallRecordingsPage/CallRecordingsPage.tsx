import {
  CallRecording,
  CallRecordingListItem,
  LoadingIndicator,
  StreamVideo,
  useCreateStreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { CallRecordingSearchForm } from './CallRecordingSearchForm';
import { LobbyHeader } from '../LobbyHeader';

export type CallRecordingsPageProps = {
  user: User;
  userToken: string;
  apiKey: string;
  gleapApiKey?: string;
};

export const CallRecordingsPage = ({
  apiKey,
  gleapApiKey,
  user,
  userToken,
}: CallRecordingsPageProps) => {
  const videoClient = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: userToken,
    user,
  });
  const [recordings, setRecordings] = useState<CallRecording[] | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(false);

  return (
    <StreamVideo client={videoClient}>
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
