import { forwardRef, useEffect } from 'react';
import classnames from 'classnames';
import { v1 as uuid } from 'uuid';
import {
  CallingState,
  ParticipantView,
  SfuModels,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
  useParticipantViewContext,
  VideoPlaceholderProps,
} from '@stream-io/video-react-sdk';

import { MicMuted, Signal } from '../Icons';
import Reaction from '../Reaction';

import { useNotificationContext } from '../../contexts/NotificationsContext';

import styles from './Participant.module.css';

export type Props = {
  className?: string;
  participant: StreamVideoParticipant;
};

export const VideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(({ participant, style }, ref) => (
  <div className={styles.placeholder} style={style} ref={ref}>
    <div className={styles.fallAvatarContainer}>
      <div className={styles.fallbackInitial}>
        {(participant.name || participant.userId)?.split('')[0]}
      </div>
    </div>
  </div>
));

export const Overlay = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const call = useCall();
  const { participant } = useParticipantViewContext();

  const {
    connectionQuality,
    sessionId,
    reaction,
    isLocalParticipant,
    publishedTracks,
    name,
    userId,
  } = participant;

  const videoOverlayClassNames = classnames(styles.videoOverlay);

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

  const connectionQualityClassNames = classnames(styles.connectionQuality, {
    [styles?.[`${connectionQualityAsString}`]]: Boolean(
      connectionQualityAsString,
    ),
    [styles.poor]: connectionQuality === SfuModels.ConnectionQuality.POOR,
    [styles.good]: connectionQuality === SfuModels.ConnectionQuality.GOOD,
    [styles.exellent]:
      connectionQuality === SfuModels.ConnectionQuality.EXCELLENT,
  });

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const nameSuffix = isLocalParticipant ? ' (You)' : '';
  return (
    <div className={videoOverlayClassNames}>
      {reaction ? (
        <Reaction
          reaction={reaction}
          className={styles.reaction}
          call={call!}
          sessionId={sessionId}
        />
      ) : null}
      <div className={styles.nameContainer}>
        <div className={styles.name}>{(name || userId) + nameSuffix}</div>
        {!hasAudio ? <MicMuted className={styles.micMuted} /> : null}
      </div>
      {connectionQuality && callingState !== CallingState.OFFLINE ? (
        <div className={connectionQualityClassNames}>
          <Signal className={styles.connectionQualityIcon} />
        </div>
      ) : null}
    </div>
  );
};

export const Participant = ({ className, participant }: Props) => {
  const {
    publishedTracks,
    isSpeaking,
    isDominantSpeaker,
    connectionQuality,
    isLocalParticipant,
  } = participant;

  const { addNotification } = useNotificationContext();

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

  const isPinned = !!participant.pin;

  useEffect(() => {
    if (
      isLocalParticipant &&
      connectionQuality === SfuModels.ConnectionQuality.POOR
    ) {
      addNotification({
        id: uuid(),
        message:
          'Poor connection quality. Please check your internet connection.',
        icon: <Signal />,
      });
    }
  }, [connectionQuality, addNotification, isLocalParticipant]);

  const rootClassNames = classnames(
    styles.root,
    {
      [styles.noAudio]: !hasAudio,
      [styles.noVideo]: !hasVideo,
      [styles.isSpeaking]: isSpeaking,
      [styles.isDominantSpeaker]: isDominantSpeaker,
      [styles.isPinned]: isPinned,
      [styles?.[`${connectionQualityAsString}`]]: Boolean(
        connectionQualityAsString,
      ),
    },
    className,
  );

  return (
    <ParticipantView
      participant={participant}
      className={rootClassNames}
      VideoPlaceholder={VideoPlaceholder}
      ParticipantViewUI={Overlay}
    />
  );
};
