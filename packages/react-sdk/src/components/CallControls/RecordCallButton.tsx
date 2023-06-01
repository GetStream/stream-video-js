import { useCallback, useEffect, useState } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useIsCallRecordingInProgress,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { LoadingIndicator } from '../LoadingIndicator';

export type RecordCallButtonProps = {
  caption?: string;
};

export const RecordCallButton = ({
  caption = 'Record',
}: RecordCallButtonProps) => {
  const call = useCall();
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
    try {
      setIsAwaitingResponse(true);
      if (isCallRecordingInProgress) {
        await call?.stopRecording();
      } else {
        await call?.startRecording();
      }
    } catch (e) {
      console.error(`Failed start recording`, e);
    }
  }, [call, isCallRecordingInProgress]);

  return (
    <Restricted
      requiredGrants={[
        OwnCapability.START_RECORD_CALL,
        OwnCapability.STOP_RECORD_CALL,
      ]}
    >
      <CompositeButton active={isCallRecordingInProgress} caption={caption}>
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
            // FIXME OL: sort out this ambiguity
            enabled={!!call}
            disabled={!call}
            icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
            title="Record call"
            onClick={toggleRecording}
          />
        )}
      </CompositeButton>
    </Restricted>
  );
};
