import { CallRecording } from '@stream-io/video-client';
import { IconButton } from '../Button';

export type CallRecordingListHeaderProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
  /** Callback to be invoked when the refresh button is clicked */
  onRefresh?: () => void;
};

export const CallRecordingListHeader = ({
  callRecordings,
  onRefresh,
}: CallRecordingListHeaderProps) => {
  return (
    <div className="str-video__call-recording-list__header">
      <div className="str-video__call-recording-list__title">
        <span>Call Recordings</span>
        {callRecordings.length ? <span>({callRecordings.length})</span> : null}
      </div>
      {onRefresh ? (
        <IconButton icon="refresh" title="Refresh" onClick={onRefresh} />
      ) : null}
    </div>
  );
};
