import { useCallback } from 'react';
import {
  OwnCapability,
  Restricted,
  SfuModels,
  StreamVideoParticipant,
  useCall,
  useConnectedUser,
  useToggleAudioMuteState,
  useToggleVideoMuteState,
} from '@stream-io/video-react-sdk';
import ParticipantsControlModal from '../ParticipantsControlModal';
import { Mic, MicMuted, Options, Video, VideoOff } from '../Icons';
import { useModalContext } from '../../contexts/ModalContext';

import styles from './ParticipantsPanel.module.css';

type ParticipantListItemProps = {
  participant: StreamVideoParticipant;
};

export const ParticipantListItem = ({
  participant,
}: ParticipantListItemProps) => {
  const call = useCall();
  const connectedUser = useConnectedUser();
  const { toggleAudioMuteState } = useToggleAudioMuteState();

  const { toggleVideoMuteState } = useToggleVideoMuteState();

  const { setModal } = useModalContext();

  const isLocalParticipant = participant?.userId === connectedUser?.id;

  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const handleSetComponent = useCallback(() => {
    setModal(<ParticipantsControlModal participant={participant} />);
  }, [participant, setModal]);

  return (
    <>
      <span className={styles.name}>
        {participant?.name || participant?.userId}{' '}
        {isLocalParticipant ? '(You)' : null}
      </span>
      <div className={styles.media}>
        <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
          <div
            onClick={() => {
              if (isLocalParticipant) {
                return toggleAudioMuteState();
              }
              if (!isAudioOn) return;
              call?.muteUser(participant.userId, 'audio');
            }}
          >
            {isAudioOn ? (
              <Mic className={styles.mic} />
            ) : (
              <MicMuted className={styles.micMuted} />
            )}
          </div>
        </Restricted>

        <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
          <div
            onClick={() => {
              if (isLocalParticipant) {
                return toggleVideoMuteState();
              }
              if (!isVideoOn) return;
              call?.muteUser(participant.userId, 'video');
            }}
          >
            {isVideoOn ? (
              <Video className={styles.video} />
            ) : (
              <VideoOff className={styles.videoOff} />
            )}
          </div>
        </Restricted>
        <Restricted
          requiredGrants={[OwnCapability.MUTE_USERS, OwnCapability.BLOCK_USERS]}
        >
          <div onClick={handleSetComponent}>
            <Options className={styles.options} />
          </div>
        </Restricted>
      </div>
    </>
  );
};
