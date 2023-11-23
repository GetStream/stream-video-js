import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

import { IconButton } from '../Button';

export type CallParticipantListHeaderProps = {
  /** Click event listener function to be invoked in order to dismiss / hide the CallParticipantsList from the UI */
  onClose: () => void;
};

export const CallParticipantListHeader = ({
  onClose,
}: CallParticipantListHeaderProps) => {
  const { useParticipants, useAnonymousParticipantCount } = useCallStateHooks();
  const participants = useParticipants();
  const anonymousParticipantCount = useAnonymousParticipantCount();
  const { t } = useI18n();

  return (
    <div className="str-video__participant-list-header">
      <div className="str-video__participant-list-header__title">
        {t('Participants')}{' '}
        <span className="str-video__participant-list-header__title-count">
          [{participants.length}]
        </span>
        {anonymousParticipantCount > 0 && (
          <span className="str-video__participant-list-header__title-anonymous">
            {t('Anonymous', { count: anonymousParticipantCount })}
          </span>
        )}
      </div>
      <IconButton
        onClick={onClose}
        className="str-video__participant-list-header__close-button"
        icon="close"
      ></IconButton>
    </div>
  );
};
