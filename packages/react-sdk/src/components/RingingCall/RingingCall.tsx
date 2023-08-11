import { CallingState, UserResponse } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../Avatar';
import { RingingCallControls } from './RingingCallControls';

const CALLING_STATE_TO_LABEL: Record<CallingState, string> = {
  [CallingState.JOINING]: 'Joining',
  [CallingState.RINGING]: 'Ringing',
  [CallingState.MIGRATING]: 'Migrating',
  [CallingState.RECONNECTING]: 'Re-connecting',
  [CallingState.RECONNECTING_FAILED]: 'Failed',
  [CallingState.OFFLINE]: 'No internet connection',
  [CallingState.IDLE]: '',
  [CallingState.UNKNOWN]: '',
  [CallingState.JOINED]: 'Joined',
  [CallingState.LEFT]: 'Left call',
};

export type RingingCallProps = {
  /**
   * Whether to include the current user in the list of members to show.
   * @default false.
   */
  includeSelf?: boolean;

  /**
   * The maximum number of members to show.
   * @default 3.
   */
  totalMembersToShow?: number;
};

export const RingingCall = (props: RingingCallProps) => {
  const { includeSelf = false, totalMembersToShow = 3 } = props;
  const call = useCall();
  const { t } = useI18n();
  const { useCallCallingState, useCallMembers } = useCallStateHooks();
  const callingState = useCallCallingState();
  const members = useCallMembers();
  const connectedUser = useConnectedUser();

  if (!call) return null;

  // take the first N members to show their avatars
  const membersToShow: UserResponse[] = (members || [])
    .slice(0, totalMembersToShow)
    .map(({ user }) => user)
    .filter((user) => user.id !== connectedUser?.id || includeSelf);
  if (
    includeSelf &&
    !membersToShow.find((user) => user.id === connectedUser?.id)
  ) {
    // if the current user is not in the initial batch of members,
    // replace the first item in membersToShow array with the current user
    const self = members.find(({ user }) => user.id === connectedUser?.id);
    if (self) {
      membersToShow.splice(0, 1, self.user);
    }
  }

  const callingStateLabel = CALLING_STATE_TO_LABEL[callingState];

  return (
    <div className="str-video__call-panel str-video__call-panel--ringing">
      <div className="str-video__call-panel__members-list">
        {membersToShow.map((user) => (
          <div key={user.id} className="str-video__call-panel__member-box">
            <Avatar name={user.name} imageSrc={user.image} />
            {user.name && (
              <div className="str-video__member_details">
                <span className="str-video__member_name">{user.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {callingStateLabel && (
        <div className="str-video__call-panel__calling-state-label">
          {t(callingStateLabel)}
        </div>
      )}

      {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
        <RingingCallControls />
      )}
    </div>
  );
};
