import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { LoadingIndicator } from '../LoadingIndicator';
import { useToggleCallRecording } from '../../hooks';

export type RecordCallButtonProps = {
  caption?: string;
};

export const RecordCallButton = ({ caption }: RecordCallButtonProps) => {
  const { t } = useI18n();
  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } =
    useToggleCallRecording();

  return (
    <Restricted
      requiredGrants={[
        OwnCapability.START_RECORD_CALL,
        OwnCapability.STOP_RECORD_CALL,
      ]}
    >
      <CompositeButton
        active={isCallRecordingInProgress}
        caption={caption}
        activeVariant="secondary"
      >
        {isAwaitingResponse ? (
          <LoadingIndicator
            tooltip={
              isCallRecordingInProgress
                ? t('Waiting for recording to stop...')
                : t('Waiting for recording to start...')
            }
          />
        ) : (
          <IconButton
            icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
            data-testid={
              isCallRecordingInProgress
                ? 'recording-stop-button'
                : 'recording-start-button'
            }
            title={caption || t('Record call')}
            onClick={toggleCallRecording}
          />
        )}
      </CompositeButton>
    </Restricted>
  );
};
