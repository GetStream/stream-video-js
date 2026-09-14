import {
  CallingState,
  CancelCallButton,
  Notification,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useEffect, useRef } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';

export interface DialingCallNotificationProps {
  onJoin: () => void;
  onLeave: () => void;
}

export function DialingCallNotification(props: {
  onJoin: () => void;
  onLeave: () => void;
}) {
  const { t } = useAppI18n();
  const call = useCall();
  const { useCallCallingState, useCallMembers } = useCallStateHooks();
  const callingState = useCallCallingState();
  const otherMembers = useCallMembers().filter(
    (m) => m.user_id !== call?.state.createdBy?.id,
  );
  const callbackRefs = useRef<DialingCallNotificationProps>(null);
  callbackRefs.current = props;

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      callbackRefs.current?.onJoin();
    } else if (callingState === CallingState.LEFT) {
      callbackRefs.current?.onLeave();
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
              {t('ringing.dialing.ringingMembers.text', {
                count: otherMembers.length,
                defaultValue_one: 'Ringing {{ count }} member',
                defaultValue_other: 'Ringing {{ count }} members',
              })}
            </div>
            <CancelCallButton onClick={handleReject} />
          </div>
        }
      />
    </div>
  );
}
