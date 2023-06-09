import { FC, useCallback, useState } from 'react';
import classnames from 'classnames';

import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
  useCall,
  useConnectedUser,
  useOwnCapabilities,
  User,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

import { AnimatedPanel } from '../Panel';
import { Invite } from '../InvitePanel';
import ParticipantsControlModal from '../ParticipantsControlModal';
import { Mic, MicMuted, Options, Search, Video, VideoOff } from '../Icons';

import { Restricted } from '../Moderation/Restricted';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
  callId: string;
  close?: () => void;
  fulllHeight?: boolean;
  visible: boolean;
};

export type RemoteParticipant = {
  participant: StreamVideoParticipant;
  handleMuteUser: (userId: string) => void;
  handleUnmuteUser?: () => void;
  handleDisableVideo: (userId: string) => void;
  handleEnableVideo?: () => void;
  handleBlockUser: (userId: string) => void;
  isAudioOn: boolean;
  isVideoOn: boolean;
  particpantName: string;
  isLocalParticipant: boolean;
};

export const LocalParticipant: FC<{
  participant: StreamVideoParticipant;
  connectedUser?: User;
}> = ({ connectedUser, participant }) => {
  return <>{connectedUser?.name || participant?.name}</>;
};

export const Participant: FC<RemoteParticipant> = ({
  participant,
  isAudioOn,
  isVideoOn,
  handleMuteUser,
  handleUnmuteUser,
  handleDisableVideo,
  handleEnableVideo,
  handleBlockUser,
}) => {
  const { setComponent } = useModalContext();

  const ownCapabilities = useOwnCapabilities();

  const handleSetComponent = useCallback(() => {
    setComponent(
      <ParticipantsControlModal
        participant={participant}
        handleMuteUser={handleMuteUser}
        handleDisableVideo={handleDisableVideo}
        handleBlockUser={handleBlockUser}
        isAudioOn={isAudioOn}
        isVideoOn={isVideoOn}
        particpantName={participant.name}
      />,
    );
  }, [
    participant,
    handleMuteUser,
    handleUnmuteUser,
    handleDisableVideo,
    handleEnableVideo,
    handleBlockUser,
    isAudioOn,
    isVideoOn,
  ]);

  return (
    <>
      <div className={styles.media}>
        <Restricted
          availableGrants={ownCapabilities}
          requiredGrants={[OwnCapability.MUTE_USERS]}
        >
          {isAudioOn ? (
            <div onClick={() => handleMuteUser(participant.userId)}>
              <Mic className={styles.mic} />
            </div>
          ) : (
            <div onClick={handleUnmuteUser}>
              <MicMuted className={styles.micMuted} />
            </div>
          )}
        </Restricted>
        <Restricted
          availableGrants={ownCapabilities}
          requiredGrants={[OwnCapability.MUTE_USERS]}
        >
          {isVideoOn ? (
            <div onClick={() => handleDisableVideo(participant.userId)}>
              <Video className={styles.video} />
            </div>
          ) : (
            <div onClick={handleEnableVideo}>
              <VideoOff className={styles.videoOff} />
            </div>
          )}
        </Restricted>

        <Restricted
          availableGrants={ownCapabilities}
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

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  close,
  className,
  participants,
  callId,
  fulllHeight,
  visible,
}) => {
  const [value, setValue]: any = useState(undefined);

  const { isVisible, close: closeModal } = useModalContext();

  const call = useCall();
  const connectedUser = useConnectedUser();

  const { publishVideoStream, publishAudioStream } = useMediaDevices();

  const rootClassname = classnames(styles.root, className);

  const handleBlockUser = useCallback(
    (participantId: string) => {
      call?.blockUser(participantId);
      if (isVisible) {
        closeModal();
      }
    },
    [isVisible, closeModal],
  );

  const handleMuteUser = useCallback(
    (participantId: string) => {
      call?.muteUser(participantId, 'audio');
      if (isVisible) {
        closeModal();
      }
    },
    [isVisible, closeModal],
  );

  const handleDisableVideo = useCallback(
    (participantId: string) => {
      call?.muteUser(participantId, 'video');
      if (isVisible) {
        closeModal();
      }
    },
    [isVisible, closeModal],
  );

  return (
    <AnimatedPanel
      className={rootClassname}
      visible={visible}
      title={
        <>
          Participants{' '}
          <span className={styles.amount}>{`(${participants?.length})`}</span>
        </>
      }
      isFocused={isFocused}
      canCollapse={true}
      fulllHeight={fulllHeight}
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
              participant?.userId === connectedUser?.id;

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
                  <span className={styles.name}>
                    {participant?.name} {isLocalParticipant ? '(You)' : null}
                  </span>
                  <Participant
                    participant={participant}
                    handleMuteUser={handleMuteUser}
                    handleDisableVideo={handleDisableVideo}
                    handleBlockUser={handleBlockUser}
                    handleEnableVideo={
                      isLocalParticipant ? publishVideoStream : undefined
                    }
                    handleUnmuteUser={
                      isLocalParticipant ? publishAudioStream : undefined
                    }
                    isAudioOn={isAudioOn}
                    isVideoOn={isVideoOn}
                    particpantName={particpantName}
                    isLocalParticipant={isLocalParticipant}
                  />
                </li>
              );
            }
            return null;
          },
        )}
      </ul>
      <div className={styles.invite}>
        <Invite callId={callId} canShare />
      </div>
    </AnimatedPanel>
  );
};
