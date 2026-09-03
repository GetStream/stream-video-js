import { forwardRef, MouseEventHandler, useCallback } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';

import { MenuToggle, ToggleMenuButtonProps } from '../Menu';

import { Button, IconButton } from '../Button';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';

const EndCallMenu = (props: {
  onLeave: MouseEventHandler<HTMLButtonElement>;
  onEnd: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { onLeave, onEnd } = props;
  const { t } = useI18n();
  return (
    <div className="str-video__end-call__confirmation">
      <Button
        variant="secondary"
        className="str-video__end-call__leave"
        data-testid="leave-call-button"
        onClick={onLeave}
      >
        <Icon icon="logout" />
        {t('Leave call')}
      </Button>
      <Restricted requiredGrants={[OwnCapability.END_CALL]}>
        <Button
          variant="destructive"
          className="str-video__end-call__end"
          data-testid="end-call-for-all-button"
          onClick={onEnd}
        >
          <Icon icon="call-end" />
          {t('End call for all')}
        </Button>
      </Restricted>
    </div>
  );
};

const CancelCallToggleMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(function CancelCallToggleMenuButtonRender({ menuShown }, ref) {
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Leave call')} tooltipDisabled={menuShown}>
      <IconButton
        icon={menuShown ? 'close' : 'call-end'}
        variant="destructive"
        data-testid="leave-call-button"
        ref={ref}
      />
    </WithTooltip>
  );
});

export type CancelCallButtonProps = {
  disabled?: boolean;
  caption?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onLeave?: (err?: Error) => void;
};

export const CancelCallConfirmButton = ({
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const call = useCall();

  const handleLeave: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        try {
          await call.leave();
          onLeave?.();
        } catch (err) {
          console.error(`Failed to leave call`, err);
          onLeave?.(err as Error);
        }
      }
    },
    [onClick, onLeave, call],
  );

  const handleEndCall: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        try {
          await call.endCall();
          onLeave?.();
        } catch (err) {
          console.error(`Failed to end call`, err);
          onLeave?.(err as Error);
        }
      }
    },
    [onClick, onLeave, call],
  );

  return (
    <MenuToggle placement="top-start" ToggleButton={CancelCallToggleMenuButton}>
      <EndCallMenu onEnd={handleEndCall} onLeave={handleLeave} />
    </MenuToggle>
  );
};

export const CancelCallButton = ({
  disabled,
  caption,
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
        try {
          await call.leave();
          onLeave?.();
        } catch (err) {
          console.error(`Failed to leave call`, err);
          onLeave?.(err as Error);
        }
      }
    },
    [onClick, onLeave, call],
  );
  return (
    <IconButton
      disabled={disabled}
      icon="call-end"
      variant="destructive"
      title={caption ?? t('Leave call')}
      data-testid="cancel-call-button"
      onClick={handleClick}
    />
  );
};
