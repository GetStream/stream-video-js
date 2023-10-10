import {
  OwnCapability,
  Restricted,
  SfuModels,
  StreamVideoParticipant,
  useCall,
} from '@stream-io/video-react-sdk';

import Panel from '../Panel';
import { MicMuted, People, VideoOff } from '../Icons';

import styles from './ParticipantsControlModal.module.css';
import { useModalContext } from '../../contexts/ModalContext';

export type ParticipantsControlModalProps = {
  participant: StreamVideoParticipant;
};

export const ParticipantsControlModal = ({
  participant,
}: ParticipantsControlModalProps) => {
  const call = useCall();
  const { closeModal } = useModalContext();

  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  return (
    <Panel
      className={styles.root}
      title={participant.name || participant.userId}
    >
      <ul className={styles.controls}>
        {isAudioOn && (
          <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
            <li
              className={styles.option}
              onClick={() => {
                call?.muteUser(participant.userId, 'audio');
                closeModal();
              }}
            >
              <MicMuted className={styles.mic} />
              <span>Mute user</span>
            </li>
          </Restricted>
        )}
        {isVideoOn && (
          <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
            <li
              className={styles.option}
              onClick={() => {
                call?.muteUser(participant.userId, 'video');
                closeModal();
              }}
            >
              <VideoOff className={styles.video} />
              <span>Disable video</span>
            </li>
          </Restricted>
        )}

        <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
          <li
            className={styles.option}
            onClick={() => {
              call?.blockUser(participant.userId);
              closeModal();
            }}
          >
            <People className={styles.people} />
            <span>Block user</span>
          </li>
        </Restricted>
      </ul>
    </Panel>
  );
};
