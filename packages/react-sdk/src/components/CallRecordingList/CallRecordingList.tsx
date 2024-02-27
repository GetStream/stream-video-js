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
import { EmptyCallRecordingListing as DefaultEmptyCallRecordingList } from './EmptyCallRecordingListing';
import {
  LoadingCallRecordingListing as DefaultLoadingCallRecordingList,
  LoadingCallRecordingListProps,
} from './LoadingCallRecordingListing';

export type CallRecordingListProps = {
  /** Array of CallRecording objects to be displayed */
  callRecordings: CallRecording[];
  /** Custom component to replace the default header implementation */
  CallRecordingListHeader?: ComponentType<CallRecordingListHeaderProps>;
  /** Custom component to replace the default list item implementation */
  CallRecordingListItem?: ComponentType<CallRecordingListItemProps>;
  /** Custom component to replace the default empty list component implementation */
  EmptyCallRecordingList?: ComponentType;
  /** Signals that a request for new list of CallRecording object has been initiated */
  loading?: boolean;
  /** Custom component to be rendered when loading is true */
  LoadingCallRecordingList?: ComponentType<LoadingCallRecordingListProps>;
  /** Callback to be invoked when the refresh button is clicked */
  onRefresh?: () => void;
};

export const CallRecordingList = ({
  callRecordings,
  CallRecordingListHeader = DefaultCallRecordingListHeader,
  CallRecordingListItem = DefaultCallRecordingListItem,
  EmptyCallRecordingList = DefaultEmptyCallRecordingList,
  loading,
  LoadingCallRecordingList = DefaultLoadingCallRecordingList,
  onRefresh,
}: CallRecordingListProps) => {
  return (
    <div className="str-video__call-recording-list">
      <CallRecordingListHeader
        callRecordings={callRecordings}
        onRefresh={onRefresh}
      />
      <div className="str-video__call-recording-list__listing">
        {loading ? (
          <LoadingCallRecordingList callRecordings={callRecordings} />
        ) : callRecordings.length ? (
          <>
            <ul className="str-video__call-recording-list__list">
              <li className="str-video__call-recording-list__item">
                <div className="str-video__call-recording-list__filename">
                  Name
                </div>
                <div className="str-video__call-recording-list__time">
                  Start time
                </div>
                <div className="str-video__call-recording-list__time">
                  End time
                </div>
                <div className="str-video__call-recording-list__download"></div>
              </li>
            </ul>
            <ul className="str-video__call-recording-list__list">
              {callRecordings.map((recording) => (
                <CallRecordingListItem
                  recording={recording}
                  key={recording.filename}
                />
              ))}
            </ul>
          </>
        ) : (
          <EmptyCallRecordingList />
        )}
      </div>
    </div>
  );
};
