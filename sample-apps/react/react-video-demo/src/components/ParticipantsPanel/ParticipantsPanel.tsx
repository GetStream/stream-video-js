import { FC, useCallback, useState } from 'react';
import classnames from 'classnames';

import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
  User,
} from '@stream-io/video-client';
import {
  useActiveCall,
  useConnectedUser,
  useOwnCapabilities,
} from '@stream-io/video-react-bindings';

import Panel from '../Panel';
import { Invite } from '../InvitePanel';
import ParticipantsControlModal from '../ParticipantsControlModal';
import { Mic, MicMuted, Options, Search, Video, VideoOff } from '../Icons';

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
  handleMuteUser: (userId: string) => void;
  handleDisableVideo: (userId: string) => void;
  handleBlockUser: (userId: string) => void;
  isAudioOn: boolean;
  isVideoOn: boolean;
  particpantName: string;
};

export const LocalParticipant: FC<{
  participant: StreamVideoParticipant;
  connectedUser?: User;
}> = ({ connectedUser, participant }) => {
  return <>{connectedUser?.name || participant?.name}</>;
};

export const RemoteParticipant: FC<RemoteParticipant> = ({
  participant,
  isAudioOn,
  isVideoOn,
  handleMuteUser,
  handleDisableVideo,
  handleBlockUser,
}) => {
  const { setComponent } = useModalContext();
  const breakpoint = useBreakpoint();

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
  }, []);

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return (
      <>
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
            <Options className={styles.options} />
          </div>
        </div>
      </>
    );
  }

  return (
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
          <MicMuted className={styles.micMuted} />
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

  const rootClassname = classnames(styles.root, className);

  const handleBlockUser = useCallback((participantId: string) => {
    call?.blockUser(participantId);
  }, []);

  const handleMuteUser = useCallback((participantId: string) => {
    call?.muteUser(participantId, 'audio');
  }, []);

  const handleDisableVideo = useCallback((participantId: string) => {
    call?.muteUser(participantId, 'video');
  }, []);

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
                  <span className={styles.name}>{participant?.name}</span>
                  {/* {!isLocalParticipant && ( */}
                  <RemoteParticipant
                    participant={participant}
                    handleMuteUser={handleMuteUser}
                    handleDisableVideo={handleDisableVideo}
                    handleBlockUser={handleBlockUser}
                    isAudioOn={isAudioOn}
                    isVideoOn={isVideoOn}
                    particpantName={particpantName}
                  />
                  {/* )} */}
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
    </Panel>
  );
};
