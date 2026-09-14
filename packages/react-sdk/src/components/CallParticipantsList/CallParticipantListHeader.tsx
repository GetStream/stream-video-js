import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';

import { IconButton } from '../Button';

export type CallParticipantListHeaderProps = {
  /**
   * Click event listener function to be invoked to dismiss / hide the CallParticipantsList from the UI.
   */
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
        {t('common.participants.label', 'Participants')}{' '}
        <span className="str-video__participant-list-header__title-count">
          [{participants.length}]
        </span>
        {anonymousParticipantCount > 0 && (
          <span className="str-video__participant-list-header__title-anonymous">
            {t(
              'participantList.anonymousCount.text',
              ', and ({{ anonymousCount }}) anonymous',
              { anonymousCount: anonymousParticipantCount },
            )}
          </span>
        )}
      </div>
      <IconButton
        size="sm"
        variant="secondary"
        onClick={onClose}
        className="str-video__participant-list-header__close-button"
        icon="close"
      />
    </div>
  );
};
