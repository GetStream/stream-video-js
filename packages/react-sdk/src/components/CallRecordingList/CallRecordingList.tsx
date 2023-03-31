import { ComponentType } from 'react';
import { CallRecording } from '@stream-io/video-client';

import {
  CallRecordingListHeader as DefaultCallRecordingListHeader,
  CallRecordingListHeaderProps,
} from './CallRecordingListHeader';
import {
  CallRecordingListItem as DefaultCallRecordingListItem,
  CallRecordingListItemProps,
} from './CallRecordingListItem';
import { EmptyCallRecordingList as DefaultEmptyCallRecordingList } from './EmptyCallRecordingList';
import {
  LoadingCallRecordingList as DefaultLoadingCallRecordingList,
  LoadingCallRecordingListProps,
} from './LoadingCallRecordingList';

export type CallRecordingListProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
  /** Custom component to replace the default header implementation */
  CallRecordingListHeader?: ComponentType<CallRecordingListHeaderProps>;
  /** Custom component to replace the default list item implementation */
  CallRecordingListItem?: ComponentType<CallRecordingListItemProps>;
  /** Custom component to replace the default empty list component implementation */
  EmptyCallRecordingList?: ComponentType;
  /** Indicator that a request for new list of CallRecording object has been initiated */
  loading?: boolean;
  /** */
  LoadingCallRecordingList?: ComponentType<LoadingCallRecordingListProps>;
};

export const CallRecordingList = ({
  callRecordings,
  CallRecordingListHeader = DefaultCallRecordingListHeader,
  CallRecordingListItem = DefaultCallRecordingListItem,
  EmptyCallRecordingList = DefaultEmptyCallRecordingList,
  loading,
  LoadingCallRecordingList = DefaultLoadingCallRecordingList,
}: CallRecordingListProps) => {
  return callRecordings.length ? (
    <div className="str-video__call-recording-list">
      <CallRecordingListHeader callRecordings={callRecordings} />
      <div className="str-video__call-recording-list__listing">
        {loading ? (
          <LoadingCallRecordingList callRecordings={callRecordings} />
        ) : (
          callRecordings.map((recording) => (
            <CallRecordingListItem
              recording={recording}
              key={recording.filename}
            />
          ))
        )}
      </div>
    </div>
  ) : (
    <EmptyCallRecordingList />
  );
};
