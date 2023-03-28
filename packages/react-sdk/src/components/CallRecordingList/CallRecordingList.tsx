import React from 'react';
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

type CallRecordingListProps = {
  /** Array of CallRecording objects */
  callRecordings: CallRecording[];
  /** Custom component to replace the default header implementation */
  CallRecordingListHeader?: React.ComponentType<CallRecordingListHeaderProps>;
  /** Custom component to replace the default list item implementation */
  CallRecordingListItem?: React.ComponentType<CallRecordingListItemProps>;
  /** Custom component to replace the default empty list component implementation */
  EmptyCallRecordingList?: React.ComponentType;
};

export const CallRecordingList = ({
  callRecordings,
  CallRecordingListHeader = DefaultCallRecordingListHeader,
  CallRecordingListItem = DefaultCallRecordingListItem,
  EmptyCallRecordingList = DefaultEmptyCallRecordingList,
}: CallRecordingListProps) => {
  return callRecordings.length ? (
    <div className="str-video__call-recording-list">
      <CallRecordingListHeader callRecordings={callRecordings} />
      <div className="str-video__call-recording-list__listing">
        {callRecordings.map((recording) => (
          <CallRecordingListItem
            recording={recording}
            key={recording.filename}
          />
        ))}
      </div>
    </div>
  ) : (
    <EmptyCallRecordingList />
  );
};
