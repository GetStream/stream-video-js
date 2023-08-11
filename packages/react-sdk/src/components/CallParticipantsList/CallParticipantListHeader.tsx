import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type CallParticipantListHeaderProps = {
  /** Click event listener function to be invoked in order to dismiss / hide the CallParticipantsList from the UI */
  onClose: () => void;
};

export const CallParticipantListHeader = ({
  onClose,
}: CallParticipantListHeaderProps) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="str-video__participant-list-header">
      <div className="str-video__participant-list-header__title">
        Participants{' '}
        <span className="str-video__participant-list-header__title-count">
          ({participants.length})
        </span>
      </div>
      <button
        onClick={onClose}
        className="str-video__participant-list-header__close-button"
      >
        <span className="str-video__participant-list-header__close-button--icon" />
      </button>
    </div>
  );
};
