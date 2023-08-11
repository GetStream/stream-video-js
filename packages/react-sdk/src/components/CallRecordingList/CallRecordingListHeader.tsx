import { CallRecording } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { IconButton } from '../Button';

export type CallRecordingListHeaderProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
};

export const CallRecordingListHeader = ({
  callRecordings,
}: CallRecordingListHeaderProps) => {
  const activeCall = useCall();

  return (
    <div className="str-video__call-recording-list__header">
      <div className="str-video__call-recording-list__title">
        <span>Call Recordings</span>
        {callRecordings.length ? <span>({callRecordings.length})</span> : null}
      </div>
      <IconButton
        icon="refresh"
        title="Refresh"
        onClick={() => activeCall?.queryRecordings()}
      />
    </div>
  );
};
