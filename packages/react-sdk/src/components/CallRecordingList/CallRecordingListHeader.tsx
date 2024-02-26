import { CallRecording } from '@stream-io/video-client';
import { useI18n } from '@stream-io/video-react-bindings';
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
  const { t } = useI18n();
  return (
    <div className="str-video__call-recording-list__header">
      <div className="str-video__call-recording-list__title">
        <span>{t('Call Recordings')}</span>
        {callRecordings.length ? <span>({callRecordings.length})</span> : null}
      </div>
      {onRefresh && (
        <IconButton icon="refresh" title={t('Refresh')} onClick={onRefresh} />
      )}
    </div>
  );
};
