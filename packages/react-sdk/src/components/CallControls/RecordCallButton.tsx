import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { LoadingIndicator } from '../LoadingIndicator';
import { useToggleCallRecording } from '../../hooks';

export type RecordCallButtonProps = {
  caption?: string;
};

export const RecordCallButton = ({ caption }: RecordCallButtonProps) => {
  const call = useCall();

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
      <CompositeButton active={isCallRecordingInProgress} caption={caption}>
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
            // FIXME OL: sort out this ambiguity
            enabled={!!call}
            disabled={!call}
            icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
            title={caption || t('Record call')}
            onClick={toggleCallRecording}
          />
        )}
      </CompositeButton>
    </Restricted>
  );
};
