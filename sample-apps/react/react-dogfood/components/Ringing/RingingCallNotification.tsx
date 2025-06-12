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
  const { useCallMembers } = useCallStateHooks();
  const connectedUser = useConnectedUser();
  const otherMembers = useCallMembers().filter(
    (m) =>
      m.user_id !== call?.state.createdBy?.id &&
      m.user_id !== connectedUser?.id,
  );

  const handleAccept = () => {
    if (call) {
      router.push(`/join/${call.id}?skip_lobby=true`);
    }
  };

  const handleReject = () => {
    if (call) {
      call.leave({ reject: true, reason: 'decline' }).catch((err) => {
        console.error('Failed to decline rining call', err);
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
            <div>
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
