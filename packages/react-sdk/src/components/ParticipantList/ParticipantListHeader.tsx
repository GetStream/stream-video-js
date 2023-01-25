import { StreamVideoParticipant } from '@stream-io/video-client';
import React from 'react';

export type ParticipantListHeaderProps = {
  /** Click event listener function to be invoked in order to dismiss / hide the ParticipantList from the UI */
  onClose: () => void;
  /** Array of call participant objects */
  participants: StreamVideoParticipant[];
};

export const ParticipantListHeader = ({
  onClose,
  participants,
}: ParticipantListHeaderProps) => {
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
