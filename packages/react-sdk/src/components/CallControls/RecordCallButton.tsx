import { useCallback, useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useIsCallRecordingInProgress,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { LoadingIndicator } from '../LoadingIndicator';

export type RecordCallButtonProps = {
  call: Call;
  caption?: string;
};

export const RecordCallButton = ({
  call,
  caption = 'Record',
}: RecordCallButtonProps) => {
  const client = useStreamVideoClient();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  useEffect(() => {
    // we wait until call.recording_started/stopped event to flips the
    // `isCallRecordingInProgress` state variable.
    // Once the flip happens, we remove the loading indicator
    setIsAwaitingResponse((isAwaiting) => {
      if (isAwaiting) return false;
      return isAwaiting;
    });
  }, [isCallRecordingInProgress]);

  const toggleRecording = useCallback(async () => {
    const { id, type } = call.data.call;
    try {
      setIsAwaitingResponse(true);
      if (isCallRecordingInProgress) {
        await client?.stopRecording(id, type);
      } else {
        await client?.startRecording(id, type);
      }
    } catch (e) {
      console.error(`Failed start recording`, e);
    }
  }, [call.data.call, client, isCallRecordingInProgress]);

  return (
    <CompositeButton enabled={isCallRecordingInProgress} caption={caption}>
      {isAwaitingResponse ? (
        <LoadingIndicator
          tooltip={
            isCallRecordingInProgress
              ? 'Waiting for recording to stop... '
              : 'Waiting for recording to start...'
          }
        />
      ) : (
        <IconButton
          icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
          title="Record call"
          onClick={toggleRecording}
        />
      )}
    </CompositeButton>
  );
};
