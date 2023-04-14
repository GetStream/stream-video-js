import { FC } from 'react';
import classnames from 'classnames';

import {
  StreamVideoParticipant,
  StreamVideoLocalParticipant,
} from '@stream-io/video-client';

import Panel from '../Panel';
import { MicMuted, VideoOff, People } from '../Icons';

import { Restricted } from '../Moderation/Restricted';

import styles from './ParticipantsControlModal.module.css';

export type Props = {
  participant: StreamVideoParticipant;
  localParticipant?: StreamVideoLocalParticipant;
  handleMuteUser: (userId: string, sessionId: string) => void;
  handleDisableVideo: (userId: string, sessionId: string) => void;
  handleBlockUser: (userId: string) => void;
  isAudioOn: boolean;
  isVideoOn: boolean;
  particpantName: string;
};

export const ParticipantsControlModal: FC<Props> = ({
  localParticipant,
  isAudioOn,
  participant,
  isVideoOn,
  handleDisableVideo,
  handleMuteUser,
  handleBlockUser,
  particpantName,
}) => {
  return (
    <Panel className={styles.root} title={particpantName}>
      <ul className={styles.controls}>
        {isAudioOn && (
          <Restricted
            availableGrants={localParticipant?.ownCapabilities ?? []}
            requiredGrants={['mute-users']}
          >
            <li
              className={styles.option}
              onClick={() =>
                handleMuteUser(participant.userId, participant.sessionId)
              }
            >
              <MicMuted className={styles.mic} />
              <span>Mute user</span>
            </li>
          </Restricted>
        )}
        {isVideoOn && (
          <Restricted
            availableGrants={localParticipant?.ownCapabilities ?? []}
            requiredGrants={['mute-users']}
          >
            <li
              className={styles.option}
              onClick={() =>
                handleDisableVideo(participant.userId, participant.sessionId)
              }
            >
              <VideoOff className={styles.video} />
              <span>Disable video</span>
            </li>
          </Restricted>
        )}

        <Restricted
          availableGrants={localParticipant?.ownCapabilities ?? []}
          requiredGrants={['block-users']}
        >
          <li
            className={styles.option}
            onClick={() => handleBlockUser(participant.userId)}
          >
            <People className={styles.people} />
            <span>Block user</span>
          </li>
        </Restricted>
      </ul>
    </Panel>
  );
};
