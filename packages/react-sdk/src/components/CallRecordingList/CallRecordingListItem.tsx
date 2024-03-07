import clsx from 'clsx';
import { CallRecording } from '@stream-io/video-client';
import { Icon } from '../Icon';

export type CallRecordingListItemProps = {
  /** CallRecording object to represent */
  recording: CallRecording;
};

const dateFormat = (date: string) => {
  const format = new Date(date);
  return format.toTimeString().split(' ')[0];
};
export const CallRecordingListItem = ({
  recording,
}: CallRecordingListItemProps) => {
  return (
    <li className="str-video__call-recording-list__item">
      <div className="str-video__call-recording-list__table-cell str-video__call-recording-list__filename">
        {recording.filename}
      </div>
      <div className="str-video__call-recording-list__table-cell str-video__call-recording-list__time">
        {dateFormat(recording.start_time)}
      </div>
      <div className="str-video__call-recording-list__table-cell str-video__call-recording-list__time">
        {dateFormat(recording.end_time)}
      </div>
      <div className="str-video__call-recording-list__table-cell str-video__call-recording-list__download">
        <a
          className={clsx(
            'str-video__call-recording-list-item__action-button',
            'str-video__call-recording-list-item__action-button--download',
          )}
          role="button"
          href={recording.url}
          download={recording.filename}
          title="Download the recording"
        >
          <Icon icon="download" />
        </a>
      </div>
    </li>
  );
};
