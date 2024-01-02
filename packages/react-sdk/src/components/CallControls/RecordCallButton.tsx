import { forwardRef } from 'react';

import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton, TextButton } from '../Button/';
import { Icon } from '../Icon';
import {
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useMenuPortalContext,
} from '../Menu';
import { LoadingIndicator } from '../LoadingIndicator';
import { useToggleCallRecording } from '../../hooks';

export type RecordCallButtonProps = {
  caption?: string;
};

const RecordEndConfirmation = () => {
  const { t } = useI18n();
  const { toggleCallRecording, isAwaitingResponse } = useToggleCallRecording();

  const { close } = useMenuPortalContext();

  return (
    <div className="str-video__end-recording__confirmation">
      <div className="str-video__end-recording__header">
        <Icon icon="recording-on" />
        <h2 className="str-video__end-recording__heading">
          {t('End recording')}
        </h2>
      </div>
      <p className="str-video__end-recording__description">
        {t('Are you sure you want end the recording?')}
      </p>
      <div className="str-video__end-recording__actions">
        <CompositeButton variant="secondary">
          <TextButton onClick={close}>{t('Cancel')}</TextButton>
        </CompositeButton>
        <CompositeButton variant="primary">
          <TextButton onClick={toggleCallRecording}>
            {isAwaitingResponse ? <Icon icon="loading" /> : t('End recording')}
          </TextButton>
        </CompositeButton>
      </div>
    </div>
  );
};

const ToggleEndRecordingMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleEndRecordingMenuButton(props, ref) {
  return (
    <CompositeButton ref={ref} active={true} variant="secondary">
      <IconButton icon="recording-off" data-testid="recording-stop-button" />
    </CompositeButton>
  );
});

export const RecordCallConfirmationButton = ({
  caption,
}: {
  caption?: string;
}) => {
  const { t } = useI18n();
  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } =
    useToggleCallRecording();

  if (isCallRecordingInProgress) {
    return (
      <Restricted
        requiredGrants={[
          OwnCapability.START_RECORD_CALL,
          OwnCapability.STOP_RECORD_CALL,
        ]}
      >
        <MenuToggle
          ToggleButton={ToggleEndRecordingMenuButton}
          visualType={MenuVisualType.PORTAL}
        >
          <RecordEndConfirmation />
        </MenuToggle>
      </Restricted>
    );
  }

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
        variant="secondary"
      >
        {isAwaitingResponse ? (
          <LoadingIndicator tooltip={t('Waiting for recording to start...')} />
        ) : (
          <IconButton
            icon="recording-off"
            data-testid="recording-start-button"
            title={caption}
            onClick={toggleCallRecording}
          />
        )}
      </CompositeButton>
    </Restricted>
  );
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
        variant="secondary"
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
