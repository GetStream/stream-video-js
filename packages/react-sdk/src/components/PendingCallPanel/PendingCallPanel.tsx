import { CallingState } from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useCallMembers,
  useCallMetadata,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../Avatar';
import { PendingCallControls } from './PendingCallControls';

const CALLING_STATE_TO_LABEL: Record<CallingState, string> = {
  [CallingState.JOINING]: 'Joining',
  [CallingState.RINGING]: 'Ringing',
  [CallingState.RECONNECTING]: 'Re-connecting',
  [CallingState.RECONNECTING_FAILED]: 'Failed',
  [CallingState.OFFLINE]: 'No internet connection',
  [CallingState.IDLE]: '',
  [CallingState.UNKNOWN]: '',
  [CallingState.JOINED]: 'Joined',
  [CallingState.LEFT]: 'Left call',
};

export const PendingCallPanel = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const { t } = useI18n();
  const metadata = useCallMetadata();
  const members = useCallMembers();

  if (!call) return null;

  const caller = metadata?.created_by;
  const membersToShow = call.isCreatedByMe
    ? members
        ?.slice(0, 3)
        .map(({ user }) => user)
        .filter((u) => !!u) || []
    : caller
    ? [caller]
    : [];

  const callingStateLabel = CALLING_STATE_TO_LABEL[callingState];

  return (
    <div className="str-video__call-panel str-video__call-panel--pending">
      <div className="str-video__call-panel__members-list">
        {membersToShow.map((user) => (
          <div key={user.id} className="str-video__call-panel__member-box">
            <Avatar name={user.name} imageSrc={user.image} />
          </div>
        ))}
      </div>

      {callingStateLabel && (
        <div className="str-video__call-panel__calling-state-label">
          {t(callingStateLabel)}
        </div>
      )}

      {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
        <PendingCallControls />
      )}
    </div>
  );
};
