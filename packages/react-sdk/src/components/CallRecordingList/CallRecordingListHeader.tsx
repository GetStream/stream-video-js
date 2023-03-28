import React from 'react';
import { CallRecording } from '@stream-io/video-client';
import { useActiveCall } from '@stream-io/video-react-bindings';

export type CallRecordingListHeaderProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
};

export const CallRecordingListHeader = ({
  callRecordings,
}: CallRecordingListHeaderProps) => {
  const activeCall = useActiveCall();

  return (
    <div className="str-video__call-recording-list__header">
      <div className="str-video__call-recording-list__title">
        <span>Call Recordings</span>
        {callRecordings.length ? <span>({callRecordings.length})</span> : null}
      </div>
      <button
        className="str-video__refresh-button"
        onClick={activeCall?.updateRecordingsList}
        title="Refresh"
      >
        <span className="str-video__refresh-button--icon" />
      </button>
    </div>
  );
};
