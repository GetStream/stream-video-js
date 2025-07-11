import {
  AcceptCallButton,
  CancelCallButton,
  Notification,
  StreamCall,
  useCall,
  useCalls,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { beep } from '../../lib/beeper';

export function RingingCallNotification() {
  const calls = useCalls();
  const ringingCall = calls.find((c) => c.ringing && !c.isCreatedByMe);

  if (!ringingCall) {
    return null;
  }

  return (
    <StreamCall call={ringingCall}>
      <RingingCallUI />
    </StreamCall>
  );
}

function RingingCallUI() {
  const { t } = useI18n();
  const router = useRouter();
  const call = useCall();
  const { useCallMembers, useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const connectedUser = useConnectedUser();
  const otherMembers = useCallMembers().filter(
    (m) =>
      m.user_id !== call?.state.createdBy?.id &&
      m.user_id !== connectedUser?.id,
  );
  const ringing =
    call &&
    session &&
    connectedUser &&
    !session.accepted_by[connectedUser.id] &&
    !session.missed_by[connectedUser.id] &&
    !session.rejected_by[connectedUser.id];

  const handleAccept = () => {
    if (call) {
      const params = new URLSearchParams(
        router.query as Record<string, string>,
      );
      params.delete('callId');
      params.set('type', call.type);
      params.set('skip_lobby', 'true');
      router.push(`/join/${call.id}?${params.toString()}`);
    }
  };

  const handleReject = () => {
    if (call) {
      call.leave({ reject: true, reason: 'decline' }).catch((err) => {
        console.error('Failed to decline ringing call', err);
      });
    }
  };

  const beepPromiseRef = useRef<Promise<void>>(null);

  useEffect(() => {
    if (ringing) {
      const beepPromise = (beepPromiseRef.current ?? Promise.resolve())
        .then(() => beep('/beeps/ring.mp3', { loop: true }))
        .catch((e: any) => {
          console.error(e);
          return () => {};
        });

      return () => {
        beepPromiseRef.current = beepPromise.then((stop) => stop());
      };
    }
  }, [ringing]);

  if (!ringing) {
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
              {t('{{ userName }} is ringing you', {
                userName: call.state.createdBy?.name ?? 'Anonymous',
              })}
              {otherMembers.length > 0 ? (
                <>
                  {' '}
                  {t('Other call members', {
                    count: otherMembers.length,
                  })}
                </>
              ) : null}
            </div>
            <AcceptCallButton onClick={handleAccept} />
            <CancelCallButton onClick={handleReject} />
          </div>
        }
      />
    </div>
  );
}
