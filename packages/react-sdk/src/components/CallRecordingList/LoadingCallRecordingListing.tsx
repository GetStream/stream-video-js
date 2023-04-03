import { CallRecording } from '@stream-io/video-client';
import { CallRecordingListItem } from './CallRecordingListItem';
import { LoadingIndicator } from '../LoadingIndicator';

export type LoadingCallRecordingListProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
};

export const LoadingCallRecordingListing = ({
  callRecordings,
}: LoadingCallRecordingListProps) => {
  return (
    <>
      {callRecordings.map((recording) => (
        <CallRecordingListItem recording={recording} key={recording.filename} />
      ))}
      <LoadingIndicator text="Recording getting ready" />
    </>
  );
};
