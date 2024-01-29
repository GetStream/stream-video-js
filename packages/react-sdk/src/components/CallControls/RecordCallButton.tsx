import { forwardRef } from 'react';

import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import { CompositeButton } from '../Button/';
import { Icon } from '../Icon';
import {
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useMenuContext,
} from '../Menu';
import { LoadingIndicator } from '../LoadingIndicator';
import { useToggleCallRecording } from '../../hooks';

export type RecordCallButtonProps = {
  caption?: string;
};

const RecordEndConfirmation = () => {
  const { t } = useI18n();
  const { toggleCallRecording, isAwaitingResponse } = useToggleCallRecording();

  const { close } = useMenuContext();

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
        <CompositeButton variant="secondary" onClick={close}>
          {t('Cancel')}
        </CompositeButton>
        <CompositeButton variant="primary" onClick={toggleCallRecording}>
          {isAwaitingResponse ? <LoadingIndicator /> : t('End recording')}
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
    <CompositeButton
      ref={ref}
      active={true}
      variant="secondary"
      data-testid="recording-stop-button"
    >
      <Icon icon="recording-off" />
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
        title={caption || t('Record call')}
        variant="secondary"
        data-testid="recording-start-button"
        onClick={isAwaitingResponse ? undefined : toggleCallRecording}
      >
        {isAwaitingResponse ? (
          <LoadingIndicator tooltip={t('Waiting for recording to start...')} />
        ) : (
          <Icon icon="recording-off" />
        )}
      </CompositeButton>
    </Restricted>
  );
};

export const RecordCallButton = ({ caption }: RecordCallButtonProps) => {
  const { t } = useI18n();
  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } =
    useToggleCallRecording();

  let title = caption || t('Record call');

  if (isAwaitingResponse) {
    title = isCallRecordingInProgress
      ? t('Waiting for recording to stop...')
      : t('Waiting for recording to start...');
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
        data-testid={
          isCallRecordingInProgress
            ? 'recording-stop-button'
            : 'recording-start-button'
        }
        title={title}
        onClick={isAwaitingResponse ? undefined : toggleCallRecording}
      >
        {isAwaitingResponse ? (
          <LoadingIndicator />
        ) : (
          <Icon
            icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
          />
        )}
      </CompositeButton>
    </Restricted>
  );
};
