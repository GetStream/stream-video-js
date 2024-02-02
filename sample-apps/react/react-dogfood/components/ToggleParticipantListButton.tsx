import { useEffect, useState } from 'react';
import {
  Avatar,
  CompositeButton,
  Icon,
  IconButtonWithMenuProps,
  useCall,
  useCallStateHooks,
  UserResponse,
} from '@stream-io/video-react-sdk';
import { useFloatingUIPreset } from '../hooks/useFloatingUIPreset';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  IconButtonWithMenuProps,
  'icon' | 'ref'
>;

export const ToggleParticipantListButton = (
  props: ToggleParticipantListButtonProps,
) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participantCount = useParticipants().length;

  const { refs, x, y } = useFloatingUIPreset({
    placement: 'top-start',
    strategy: 'absolute',
  });

  const [waitingRoom, setWaitingRoom] = useState<UserResponse[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('custom', (event) => {
      if (event.type !== 'custom') return;
      if (event.custom['type'] !== 'pronto.request-to-join-call') return;
      setWaitingRoom((queue) => [...queue, event.user]);
      setIsDismissed(false);
    });
  }, [call]);

  const [isDismissed, setIsDismissed] = useState(false);
  const admitUser = (user: UserResponse) => async () => {
    if (!call) return;
    await call.updateCallMembers({
      update_members: [{ user_id: user.id, role: 'call_member' }],
    });
    setWaitingRoom((queue) => queue.filter((u) => u.id !== user.id));
  };

  return (
    <div className="rd__toggle-participants" ref={refs.setReference}>
      {!isDismissed && waitingRoom.length > 0 && (
        <div
          className="str-video__menu-container rd__waiting-room-list"
          ref={refs.setFloating}
          style={{
            position: 'absolute',
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          <p className="rd__waiting-room-list__title">
            <Icon className="rd__waiting-room-list__title-icon" icon="info" />
            Someone wants to join the call
          </p>
          <ul className="rd__waiting-room-list__users">
            {waitingRoom.map((user) => (
              <li className="rd__waiting-room-list__user" key={user.id}>
                <Avatar name={user.name || user.id} imageSrc={user.image} />
                <span className="rd__waiting-room-list__user-name">
                  {user.name || user.id}
                </span>
                <button
                  className="rd__button rd__waiting-room-list__admit"
                  type="button"
                  onClick={admitUser(user)}
                >
                  Admit
                </button>
              </li>
            ))}
          </ul>
          <div className="rd__waiting-room-list__footer">
            <button
              className="rd__button rd__waiting-room-list__dismiss"
              type="button"
              onClick={() => setIsDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <CompositeButton title="Participants" {...props}>
        <Icon icon="participants" />
        {participantCount > 1 && (
          <span className="rd__participant-count">{participantCount}</span>
        )}
      </CompositeButton>
    </div>
  );
};
