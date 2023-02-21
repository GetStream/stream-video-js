import { Call } from '@stream-io/video-client';
import {
  useIsCallRecordingInProgress,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';

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
  const callMeta = call.data.call;

  return (
    <CompositeButton enabled={isCallRecordingInProgress} caption={caption}>
    <IconButton
      icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
      title="Record call"
      onClick={() => {
        if (!callMeta) return;
        if (isCallRecordingInProgress) {
          client?.stopRecording(callMeta.id!, callMeta.type!);
        } else {
          client?.startRecording(callMeta.id!, callMeta.type!);
        }
      }}
    />
    </CompositeButton>
  );
};
