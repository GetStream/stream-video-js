import {
  CallingState,
  CancelCallButton,
  Notification,
  useCall,
  getCallStateHooks,
  useI18n,
  useEffectEvent,
} from '@stream-io/video-react-sdk';
import { useEffect } from 'react';

export interface DialingCallNotificationProps {
  onJoin: () => void;
  onLeave: () => void;
}

const { useCallCallingState, useCallMembers } = getCallStateHooks();
export function DialingCallNotification(props: {
  onJoin: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const call = useCall();
  const callingState = useCallCallingState();
  const otherMembers = useCallMembers().filter(
    (m) => m.user_id !== call?.state.createdBy?.id,
  );
  const onJoin = useEffectEvent(props.onJoin ?? (() => {}));
  const onLeave = useEffectEvent(props.onLeave ?? (() => {}));

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      onJoin();
    } else if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState]);

  const handleReject = () => {
    if (call) {
      call.leave({ reject: true, reason: 'cancel' }).catch((err) => {
        console.error('Failed to cancel ringing call', err);
      });
    }
  };

  if (!call) {
    return null;
  }

  return (
    <div className="rd__dialer-ringing-call">
      <Notification
        isVisible
        placement="bottom"
        message={
          <div className="rd__dialer-ringing-call-notification">
            <div className="rd__dialer-ringing-call-notification-text">
              {t('Ringing {{ count }} members', { count: otherMembers.length })}
            </div>
            <CancelCallButton onClick={handleReject} />
          </div>
        }
      />
    </div>
  );
}
