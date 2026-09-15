import { useEffect, useState } from 'react';
import {
  Avatar,
  CompositeButton,
  CompositeButtonProps,
  Icon,
  useCall,
  useCallStateHooks,
  UserResponse,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { useFloatingUIPreset } from '../hooks/useFloatingUIPreset';
import { useAppI18n } from '../hooks/useAppI18n';

export type ToggleParticipantListButtonProps = { caption?: string } & Omit<
  CompositeButtonProps,
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
  const { t } = useAppI18n();

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
            {t(
              'participants.joinRequest.text',
              'Someone wants to join the call',
            )}
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
                  {t('participants.admit.label', 'Admit')}
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
              {t('common.dismiss.label', 'Dismiss')}
            </button>
          </div>
        </div>
      )}
      <WithTooltip title={t('common.participants.label', 'Participants')}>
        <CompositeButton
          title={t('common.participants.label', 'Participants')}
          {...props}
        >
          <Icon icon="participants" />
          {participantCount > 1 && (
            <span className="rd__participant-count">{participantCount}</span>
          )}
        </CompositeButton>
      </WithTooltip>
    </div>
  );
};
