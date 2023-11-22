import { MouseEventHandler, useCallback, forwardRef } from 'react';
import { useCall } from '@stream-io/video-react-bindings';

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
  return (
    <div className="str-video__end-call__confirmation">
      <button className="str-video__end-call__leave" onClick={handleLeave}>
        <Icon className="str-video__end-call__leave-icon" icon="logout" />
        Leave call
      </button>

      <button className="str-video__end-call__end" onClick={handleEndCall}>
        <Icon className="str-video__end-call__end-icon" icon="call-end" />
        End call for all
      </button>
    </div>
  );
};

export const ToggleMenuButton = forwardRef<HTMLButtonElement>(
  (props: any, ref) => {
    return (
      <IconButton
        icon={props.active ? 'close' : 'call-end'}
        variant={props.active ? undefined : 'danger'}
        ref={ref}
      />
    );
  },
);

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
      onClick={handleClick}
    />
  );
};
