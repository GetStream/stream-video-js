import { FC, useState, useCallback } from 'react';
import classnames from 'classnames';

import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import {
  useConnectedUser,
  useActiveCall,
  useLocalParticipant,
  useCall,
} from '@stream-io/video-react-bindings';

import Panel from '../Panel';
import { MicMuted, Mic, Video, VideoOff, Search } from '../Icons';

import { Restricted } from '../Moderation/Restricted';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  className,
  participants,
}) => {
  const [value, setValue]: any = useState(undefined);

  const call = useActiveCall();
  const connectedUser = useConnectedUser();
  const localParticipant = useLocalParticipant();

  const rootClassname = classnames(styles.root, className);

  const handleBlockUser = useCallback((participantId: string) => {
    call?.blockUser(participantId);
  }, []);

  const handleMuteUser = useCallback(
    (participantId: string, participantSessionId: string) => {
      call?.muteUser(participantId, 'audio', participantSessionId);
    },
    [],
  );
  const handleDisableVideo = useCallback(
    (participantId: string, participantSessionId: string) => {
      call?.muteUser(participantId, 'video', participantSessionId);
    },
    [],
  );

  return (
    <Panel
      className={rootClassname}
      title={
        <>
          Participants{' '}
          <span className={styles.amount}>{`(${participants?.length})`}</span>
        </>
      }
      isFocused={isFocused}
      canCollapse={true}
    >
      <div className={styles.search}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search"
          onBlur={(e) => setValue(e.currentTarget.value)}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      <ul>
        {participants?.map(
          (participant: StreamVideoParticipant, index: number) => {
            const particpantName = String(participant?.name).toLowerCase();
            const searchValue = value?.toLowerCase();

            const isLocalParticipant =
              participant?.userId === connectedUser?.id
                ? import.meta.env.VITE_VIDEO_USER_ID
                : '';

            const isAudioOn = participant.publishedTracks.includes(
              SfuModels.TrackType.AUDIO,
            );
            const isVideoOn = participant.publishedTracks.includes(
              SfuModels.TrackType.VIDEO,
            );

            if (
              value === undefined ||
              value === null ||
              particpantName.startsWith(searchValue)
            ) {
              return (
                <li className={styles.participant} key={`participant-${index}`}>
                  {isLocalParticipant ? connectedUser?.name : participant?.name}
                  {!isLocalParticipant ? (
                    <div className={styles.media}>
                      <Restricted
                        availableGrants={
                          localParticipant?.ownCapabilities ?? []
                        }
                        requiredGrants={['mute-users']}
                      >
                        {isAudioOn ? (
                          <div
                            onClick={() =>
                              handleMuteUser(
                                participant.userId,
                                participant.sessionId,
                              )
                            }
                          >
                            <Mic className={styles.mic} />
                          </div>
                        ) : (
                          <MicMuted className={styles.micMuted} />
                        )}
                      </Restricted>
                      <Restricted
                        availableGrants={
                          localParticipant?.ownCapabilities ?? []
                        }
                        requiredGrants={['mute-users']}
                      >
                        {isVideoOn ? (
                          <div
                            onClick={() =>
                              handleDisableVideo(
                                participant.userId,
                                participant.sessionId,
                              )
                            }
                          >
                            <Video className={styles.video} />
                          </div>
                        ) : (
                          <VideoOff className={styles.videoOff} />
                        )}
                      </Restricted>
                    </div>
                  ) : null}
                </li>
              );
            }
            return null;
          },
        )}
      </ul>
    </Panel>
  );
};
