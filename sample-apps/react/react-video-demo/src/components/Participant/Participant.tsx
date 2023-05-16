import { FC, useState, useEffect } from 'react';
import classnames from 'classnames';
import {
  StreamVideoParticipant,
  Video,
  Audio,
  Call,
  SfuModels,
  VisibilityState,
} from '@stream-io/video-react-sdk';

import { MicMuted, Signal } from '../Icons';
import Reaction from '../Reaction';

import styles from './Participant.module.css';

export type Props = {
  className?: string;
  call: Call;
  participant: StreamVideoParticipant;
  sinkId?: string;
};

export const Overlay: FC<{
  name?: string;
  hasAudio?: boolean;
  connectionQuality?: string | boolean;
}> = ({ name, hasAudio, connectionQuality }) => {
  const connectionQualityClassNames = classnames(styles.connectionQualityIcon, {
    [styles?.[`${connectionQuality}`]]: Boolean(connectionQuality),
  });

  return (
    <div className={styles.videoOverlay}>
      <div className={styles.name}>
        {name}
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
  sinkId,
}) => {
  const {
    publishedTracks,
    isSpeaking,
    isDominantSpeaker,
    connectionQuality,
    audioStream,
    sessionId,
    reaction,
  } = participant;

  const [trackedElement, setTrackedElement] = useState<HTMLDivElement | null>(
    null,
  );

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

  const isPinned = !!participant.pinnedAt;

  useEffect(() => {
    if (!trackedElement) return;

    const unobserve = call.viewportTracker.observe(trackedElement, (entry) => {
      call.state.updateParticipant(sessionId, (p) => ({
        ...p,
        viewportVisibilityState: entry.isIntersecting
          ? VisibilityState.VISIBLE
          : VisibilityState.INVISIBLE,
      }));
    });

    return () => {
      unobserve();
      call.state.updateParticipant(sessionId, (p) => ({
        ...p,
        viewportVisibilityState: VisibilityState.UNKNOWN,
      }));
    };
  }, [trackedElement, call.viewportTracker, call.state, sessionId]);

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

  const disabledPreviewClassNames = classnames(
    className,
    styles.disabledPreview,
  );

  if (!hasVideo) {
    return (
      <div className={disabledPreviewClassNames}>
        <div className={styles.fallbackAvatar}>
          {participant.name?.split('')[0]}
        </div>
        <Overlay name={participant.name} hasAudio={hasAudio} />
      </div>
    );
  }

  return (
    <div className={rootClassNames} ref={setTrackedElement}>
      <Video
        participant={participant}
        kind="video"
        muted={participant.isLoggedInUser}
        autoPlay
        call={call}
        className={styles.video}
      />

      <Audio
        muted={participant.isLoggedInUser}
        sinkId={sinkId}
        audioStream={audioStream}
      />

      {reaction && (
        <Reaction
          className={styles.reaction}
          reaction={reaction}
          sessionId={sessionId}
          call={call}
        />
      )}

      <Overlay
        connectionQuality={connectionQualityAsString}
        name={participant.name}
        hasAudio={hasAudio}
      />
    </div>
  );
};
