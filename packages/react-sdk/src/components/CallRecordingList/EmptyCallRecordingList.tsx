import clsx from 'clsx';
import { CallRecordingListHeader } from './CallRecordingListHeader';

export const EmptyCallRecordingList = () => {
  return (
    <div
      className={clsx(
        'str-video__call-recording-list',
        'str-video__call-recording-list--empty',
      )}
    >
      <CallRecordingListHeader callRecordings={[]} />
      <div className="str-video__call-recording-list__listing str-video__call-recording-list__listing--empty">
        <div className="str-video__call-recording-list__listing--icon-empty" />
        <p className="str-video__call-recording-list__listing--text-empty">
          {/* todo: introduce i18n to enable text customization */}
          No recordings available
        </p>
      </div>
    </div>
  );
};
