import { CallingState, UserResponse } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { StreamTFunction, useI18n } from '../../i18n';
import { Avatar } from '../Avatar';
import { RingingCallControls } from './RingingCallControls';

/**
 * The label rendered for the current calling state.
 *
 * A `switch` of literal `t()` calls rather than a `Record<CallingState, string>` fed into a `t()`
 * lookup on a runtime value: the literal keys are statically extractable, which is what makes
 * `Migrating`, `Failed`, `Joined` and `Left call` translatable - none had a catalog entry before.
 * `IDLE` and `UNKNOWN` render nothing and get no key.
 */
const getCallingStateLabel = (
  callingState: CallingState,
  t: StreamTFunction,
): string | undefined => {
  switch (callingState) {
    case CallingState.JOINING:
      return t('ringingCall.callingState.joining.text', 'Joining');
    case CallingState.RINGING:
      return t('ringingCall.callingState.ringing.text', 'Ringing');
    case CallingState.MIGRATING:
      return t('ringingCall.callingState.migrating.text', 'Migrating');
    case CallingState.RECONNECTING:
      return t('ringingCall.callingState.reconnecting.text', 'Re-connecting');
    case CallingState.RECONNECTING_FAILED:
      return t('ringingCall.callingState.reconnectingFailed.text', 'Failed');
    case CallingState.OFFLINE:
      return t(
        'ringingCall.callingState.offline.text',
        'No internet connection',
      );
    case CallingState.JOINED:
      return t('ringingCall.callingState.joined.text', 'Joined');
    case CallingState.LEFT:
      return t('ringingCall.callingState.left.text', 'Left call');
    case CallingState.IDLE:
    case CallingState.UNKNOWN:
    default:
      return undefined;
  }
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

  const callingStateLabel = getCallingStateLabel(callingState, t);

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
          {callingStateLabel}
        </div>
      )}

      {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
        <RingingCallControls />
      )}
    </div>
  );
};
