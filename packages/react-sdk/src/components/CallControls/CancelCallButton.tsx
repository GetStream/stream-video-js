import { forwardRef, MouseEventHandler, useCallback } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';

import { MenuToggle } from '../Menu';

import { IconButton } from '../Button';
import { Icon } from '../Icon';

export type CancelCallButtonProps = {
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onLeave?: () => void;
};

export const EndCallMenu = ({
  handleLeave,
  handleEndCall,
}: {
  handleLeave: MouseEventHandler<HTMLButtonElement>;
  handleEndCall: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { t } = useI18n();
  return (
    <div className="str-video__end-call__confirmation">
      <Restricted requiredGrants={[OwnCapability.END_CALL]}>
        <button
          className="str-video__button str-video__end-call__end"
          type="button"
          data-testid="end-call-for-all-button"
          onClick={handleEndCall}
        >
          <Icon
            className="str-video__button__icon str-video__end-call__end-icon"
            icon="call-end"
          />
          {t('End call for all')}
        </button>
      </Restricted>
      <button
        className="str-video__button str-video__end-call__leave"
        type="button"
        data-testid="leave-call-button"
        onClick={handleLeave}
      >
        <Icon
          className="str-video__button__icon str-video__end-call__leave-icon"
          icon="logout"
        />
        {t('Leave call')}
      </button>
    </div>
  );
};

const ToggleMenuButton = forwardRef<HTMLButtonElement>((props: any, ref) => {
  const { t } = useI18n();
  return (
    <IconButton
      icon={props.active ? 'close' : 'call-end'}
      variant={props.active ? undefined : 'danger'}
      title={t('Leave call')}
      data-testid="leave-call-button"
      ref={ref}
    />
  );
});

export const CancelCallConfirmButton = ({
  disabled,
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const call = useCall();

  const handleLeave: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        await call.leave();
        onLeave?.();
      }
    },
    [onClick, onLeave, call],
  );

  const handleEndCall: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        await call.endCall();
        onLeave?.();
      }
    },
    [onClick, onLeave, call],
  );

  return (
    <MenuToggle placement="top-start" ToggleButton={ToggleMenuButton}>
      <EndCallMenu handleEndCall={handleEndCall} handleLeave={handleLeave} />
    </MenuToggle>
  );
};

export const CancelCallButton = ({
  disabled,
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const call = useCall();
  const { t } = useI18n();
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        await call.leave();
        onLeave?.();
      }
    },
    [onClick, onLeave, call],
  );
  return (
    <IconButton
      disabled={disabled}
      icon="call-end"
      variant="danger"
      title={t('Leave call')}
      data-testid="cancel-call-button"
      onClick={handleClick}
    />
  );
};
