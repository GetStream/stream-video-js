import { FC, forwardRef, useEffect } from 'react';
import classnames from 'classnames';
import { v1 as uuid } from 'uuid';
import {
  StreamVideoParticipant,
  Call,
  SfuModels,
  ParticipantView,
  StreamReaction,
  VideoPlaceholderProps,
} from '@stream-io/video-react-sdk';

import { MicMuted, Signal } from '../Icons';
import Reaction from '../Reaction';

import { useNotificationContext } from '../../contexts/NotificationsContext';

import styles from './Participant.module.css';

export type Props = {
  className?: string;
  call: Call;
  participant: StreamVideoParticipant;
  sinkId?: string;
  slider?: 'horizontal' | 'vertical';
};

// export const VideoPlaceholder: FC<{
//   participant: StreamVideoParticipant;
//   hasAudio: boolean;
//   sessionId: string;
//   call: Call;
//   className?: string;
//   slider?: 'horizontal' | 'vertical';
// }> = ({ participant, hasAudio, sessionId, call, className }) => {
//   const disabledPreviewClassNames = classnames(
//     className,
//     styles.disabledPreview,
//   );
//
//   return (
//     <div className={disabledPreviewClassNames}>
//       <div className={styles.fallAvatarContainer}>
//         <div className={styles.fallbackInitial}>
//           {participant.name?.split('')[0]}
//         </div>
//       </div>
//       <Overlay
//         name={participant.name}
//         hasAudio={hasAudio}
//         call={call}
//         sessionId={sessionId}
//       />
//     </div>
//   );
// };

const VideoPlaceholder = forwardRef<HTMLDivElement, VideoPlaceholderProps>(
  ({ participant }, ref) => (
    <div className={styles.placeholder} ref={ref}>
      <div className={styles.fallAvatarContainer}>
        <div className={styles.fallbackInitial}>
          {participant.name?.split('')[0]}
        </div>
      </div>
    </div>
  ),
);

export const Overlay: FC<{
  name?: string;
  hasAudio?: boolean;
  connectionQuality?: string | boolean;
  reaction?: StreamReaction;
  call: Call;
  sessionId: string;
  slider?: 'horizontal' | 'vertical';
}> = ({
  name,
  hasAudio,
  connectionQuality,
  reaction,
  call,
  sessionId,
  slider,
}) => {
  const videoOverlayClassNames = classnames(styles.videoOverlay, {
    [styles?.[`${slider}`]]: Boolean(slider),
  });
  const connectionQualityClassNames = classnames(styles.connectionQualityIcon, {
    [styles?.[`${connectionQuality}`]]: Boolean(connectionQuality),
  });

  return (
    <div className={videoOverlayClassNames}>
      {reaction ? (
        <Reaction
          reaction={reaction}
          className={styles.reaction}
          call={call}
          sessionId={sessionId}
        />
      ) : null}
      <div className={styles.nameContainer}>
        <div className={styles.name}>{name}</div>
        {!hasAudio ? <MicMuted className={styles.micMuted} /> : null}
      </div>
      {connectionQuality ? (
        <div className={styles.connectionQuality}>
          <Signal className={connectionQualityClassNames} />
        </div>
      ) : null}
    </div>
  );
};

export const Participant: FC<Props> = ({
  className,
  call,
  participant,
  slider,
}) => {
  const {
    publishedTracks,
    isSpeaking,
    isDominantSpeaker,
    connectionQuality,
    sessionId,
    reaction,
  } = participant;

  const { addNotification } = useNotificationContext();

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

  const isPinned = !!participant.pinnedAt;

  useEffect(() => {
    if (connectionQuality === SfuModels.ConnectionQuality.POOR) {
      addNotification({
        id: uuid(),
        message:
          'Poor connection quality. Please check your internet connection.',
        icon: <Signal />,
      });
    }
  }, [connectionQuality, addNotification]);

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
      ParticipantViewUI={
        <Overlay
          connectionQuality={connectionQualityAsString}
          name={participant.name}
          hasAudio={hasAudio}
          reaction={reaction}
          call={call}
          sessionId={sessionId}
          slider={slider}
        />
      }
    />
  );
};
