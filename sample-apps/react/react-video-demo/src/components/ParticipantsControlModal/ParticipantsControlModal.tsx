import { FC } from 'react';

import {
  OwnCapability,
  StreamVideoParticipant,
  useOwnCapabilities,
} from '@stream-io/video-react-sdk';

import Panel from '../Panel';
import { MicMuted, People, VideoOff } from '../Icons';

import { Restricted } from '../Moderation/Restricted';

import styles from './ParticipantsControlModal.module.css';

export type Props = {
  participant: StreamVideoParticipant;
  handleMuteUser: (userId: string, sessionId: string) => void;
  handleDisableVideo: (userId: string, sessionId: string) => void;
  handleBlockUser: (userId: string) => void;
  isAudioOn: boolean;
  isVideoOn: boolean;
  particpantName: string;
};

export const ParticipantsControlModal: FC<Props> = ({
  isAudioOn,
  participant,
  isVideoOn,
  handleDisableVideo,
  handleMuteUser,
  handleBlockUser,
  particpantName,
}) => {
  const ownCapabilities = useOwnCapabilities();
  return (
    <Panel className={styles.root} title={particpantName}>
      <ul className={styles.controls}>
        {isAudioOn && (
          <Restricted
            availableGrants={ownCapabilities}
            requiredGrants={[OwnCapability.MUTE_USERS]}
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
            availableGrants={ownCapabilities}
            requiredGrants={[OwnCapability.MUTE_USERS]}
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
          availableGrants={ownCapabilities}
          requiredGrants={[OwnCapability.BLOCK_USERS]}
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
