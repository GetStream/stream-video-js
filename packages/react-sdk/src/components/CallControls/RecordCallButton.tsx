import * as React from 'react';
import { Call } from '@stream-io/video-client';
import {
  useIsCallRecordingInProgress,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { Button } from './Button';

export type RecordCallButtonProps = {
  call: Call;
};

export const RecordCallButton = ({ call }: RecordCallButtonProps) => {
  const client = useStreamVideoClient();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const callMeta = call.data.call;
  return (
    <Button
      icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
      title="Record call"
      onClick={() => {
        if (!callMeta) return;
        if (isCallRecordingInProgress) {
          client?.stopRecording(callMeta.id, callMeta.type);
        } else {
          client?.startRecording(callMeta.id, callMeta.type);
        }
      }}
    />
  );
};
