import { CallingState } from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../Avatar';
import { PendingCallControls } from './PendingCallControls';

export const PendingCallPanel = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const { t } = useI18n();

  if (!call) return null;

  const metadata = useCallMetadata();
  const caller = metadata?.created_by;
  const members = useCallMembers();
  const membersToShow = call.isCreatedByMe
    ? members
        ?.slice(0, 3)
        .map(({ user }) => user)
        .filter((u) => !!u) || []
    : caller
    ? [caller]
    : [];

  return (
    <div className="str-video__call-panel str-video__call-panel--pending">
      <div className="str-video__call-panel__members-list">
        {membersToShow.map((user) => (
          <div key={user.id} className="str-video__call-panel__member-box">
            <Avatar name={user.name} imageSrc={user.image} />
          </div>
        ))}
      </div>
      {callingState === CallingState.RINGING && <div>{t('Ringing')}</div>}
      {callingState === CallingState.JOINING && <div>{t('Joining')}</div>}
      {callingState === CallingState.RECONNECTING && (
        <div>{t('Re-connecting')}</div>
      )}
      {callingState === CallingState.RECONNECTING_FAILED && (
        <div>{t('Failed')}</div>
      )}
      {callingState === CallingState.OFFLINE && (
        <div>{t('No internet connection')}</div>
      )}

      {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
        <PendingCallControls />
      )}
    </div>
  );
};
