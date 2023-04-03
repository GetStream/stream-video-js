import { FC, useState, useCallback } from 'react';
import classnames from 'classnames';

import {
  SfuModels,
  StreamVideoParticipant,
  StreamVideoLocalParticipant,
  User,
} from '@stream-io/video-client';
import {
  useConnectedUser,
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import Panel from '../Panel';
import { Invite } from '../InvitePanel';
import { MicMuted, Mic, Video, VideoOff, Search, Settings } from '../Icons';

import { Restricted } from '../Moderation/Restricted';

import { useBreakpoint } from '../../hooks/useBreakpoints';
import { useModalContext } from '../../contexts/ModalContext';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
  callId: string;
  close?: () => void;
};

export type RemoteParticipant = {
  participant: StreamVideoParticipant;
  localParticipant?: StreamVideoLocalParticipant;
  handleMuteUser: (userId: string, sessionId: string) => void;
  handleDisableVideo: (userId: string, sessionId: string) => void;
  handleBlockUser: (userId: string) => void;
  isAudioOn: boolean;
  isVideoOn: boolean;
  particpantName: string;
};

export const ParticipantsControlModal: FC<RemoteParticipant> = ({
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
    <Panel className={styles.media} title={particpantName}>
      <ul>
        {isAudioOn && (
          <li>
            <Restricted
              availableGrants={localParticipant?.ownCapabilities ?? []}
              requiredGrants={['mute-users']}
            >
              <div
                onClick={() =>
                  handleMuteUser(participant.userId, participant.sessionId)
                }
              >
                <MicMuted className={styles.micMuted} />
                <span>Mute user</span>
              </div>
            </Restricted>
          </li>
        )}
        {isVideoOn && (
          <li>
            <Restricted
              availableGrants={localParticipant?.ownCapabilities ?? []}
              requiredGrants={['mute-users']}
            >
              <div
                onClick={() =>
                  handleDisableVideo(participant.userId, participant.sessionId)
                }
              >
                <Video className={styles.videoOff} />
                <span>Disable video</span>
              </div>
            </Restricted>
          </li>
        )}

        <li>
          <Restricted
            availableGrants={localParticipant?.ownCapabilities ?? []}
            requiredGrants={['block-users']}
          >
            <div onClick={() => handleBlockUser(participant.userId)}>
              <Video className={styles.video} />
              <span>Disable video</span>
            </div>
          </Restricted>
        </li>
      </ul>
    </Panel>
  );
};

export const LocalParticipant: FC<{
  participant: StreamVideoParticipant;
  connectedUser?: User;
}> = ({ connectedUser, participant }) => {
  return <>{connectedUser?.name || participant?.name}</>;
};

export const RemoteParticipant: FC<RemoteParticipant> = ({
  participant,
  localParticipant,
  isAudioOn,
  isVideoOn,
  handleMuteUser,
  handleDisableVideo,
  handleBlockUser,
}) => {
  const { setComponent } = useModalContext();
  const breakpoint = useBreakpoint();

  const handleSetComponent = useCallback(() => {
    setComponent(
      <ParticipantsControlModal
        participant={participant}
        localParticipant={localParticipant}
        handleMuteUser={handleMuteUser}
        handleDisableVideo={handleDisableVideo}
        handleBlockUser={handleBlockUser}
        isAudioOn={isAudioOn}
        isVideoOn={isVideoOn}
        particpantName={participant.name}
      />,
    );
  }, []);

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return (
      <div className={styles.media}>
        {isAudioOn ? (
          <Mic className={styles.mic} />
        ) : (
          <MicMuted className={styles.micMuted} />
        )}

        {isVideoOn ? (
          <Video className={styles.video} />
        ) : (
          <VideoOff className={styles.videoOff} />
        )}
        <div onClick={handleSetComponent}>
          <Settings />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.media}>
      <Restricted
        availableGrants={localParticipant?.ownCapabilities ?? []}
        requiredGrants={['mute-users']}
      >
        {isAudioOn ? (
          <div
            onClick={() =>
              handleMuteUser(participant.userId, participant.sessionId)
            }
          >
            <Mic className={styles.mic} />
          </div>
        ) : (
          <MicMuted className={styles.micMuted} />
        )}
      </Restricted>
      <Restricted
        availableGrants={localParticipant?.ownCapabilities ?? []}
        requiredGrants={['mute-users']}
      >
        {isVideoOn ? (
          <div
            onClick={() =>
              handleDisableVideo(participant.userId, participant.sessionId)
            }
          >
            <Video className={styles.video} />
          </div>
        ) : (
          <VideoOff className={styles.videoOff} />
        )}
      </Restricted>
    </div>
  );
};

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  close,
  className,
  participants,
  callId,
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
      close={close}
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
      <ul className={styles.participants}>
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
                  {!isLocalParticipant ? (
                    <RemoteParticipant
                      participant={participant}
                      localParticipant={localParticipant}
                      handleMuteUser={handleMuteUser}
                      handleDisableVideo={handleDisableVideo}
                      handleBlockUser={handleBlockUser}
                      isAudioOn={isAudioOn}
                      isVideoOn={isVideoOn}
                      particpantName={particpantName}
                    />
                  ) : (
                    <LocalParticipant
                      connectedUser={connectedUser}
                      participant={participant}
                    />
                  )}
                </li>
              );
            }
            return null;
          },
        )}
      </ul>
      <div>
        <Invite callId={callId} />
      </div>
    </Panel>
  );
};
