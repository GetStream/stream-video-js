import { useCallback, useState } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useIsCallRecordingInProgress,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { LoadingIndicator } from '../LoadingIndicator';

export type RecordCallButtonProps = {
  call: Call;
};

export const RecordCallButton = ({ call }: RecordCallButtonProps) => {
  const client = useStreamVideoClient();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const toggleRecording = useCallback(async () => {
    const { id, type } = call.data.call;
    if (isCallRecordingInProgress) {
      client?.stopRecording(id, type);
    } else {
      try {
        setIsWaitingForResponse(true);
        await client?.startRecording(id, type);
      } finally {
        setIsWaitingForResponse(false);
      }
    }
  }, [call.data.call, client, isCallRecordingInProgress]);

  if (isWaitingForResponse) {
    return <LoadingIndicator tooltip="Waiting for recording to start..." />;
  }

  return (
    <CallControlsButton
      icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
      title="Record call"
      onClick={toggleRecording}
    />
  );
};
