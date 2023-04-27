import { forwardRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  Call,
  SfuModels,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import { useIsDebugMode } from '../../../components/Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../../../components/Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../../../components/Debug/DebugStatsView';
import { Audio } from '../Audio/Audio';
import { Video } from '../../../components/Video';
import { Notification } from '../../../components/Notification';
import { Reaction } from '../../../components/Reaction';
import { MenuToggle, ToggleMenuButtonProps } from '../../../components/Menu';
import { IconButton } from '../../../components/Button';
import { ParticipantActionsContextMenu } from '../../../components/CallParticipantsList';

export interface ParticipantBoxProps {
  /**
   * The participant bound to this component.
   */
  participant: StreamVideoParticipant;

  /**
   * The current call.
   */
  call: Call;

  /**
   * In supported browsers, this sets the default audio output.
   * The value of this prop should be a valid Audio Output `deviceId`.
   */
  sinkId?: string;

  /**
   * The kind of video stream to play for the given participant.
   */
  videoKind?: 'video' | 'screen';

  /**
   * Turns on/off the status indicator icons (mute, connection quality, etc...).
   */
  indicatorsVisible?: boolean;

  /**
   * Turns on/off the audio for the participant.
   */
  muteAudio?: boolean;

  /**
   * A function meant for exposing the "native" element ref to the integrators.
   * The element can either be:
   * - `<video />` for participants with enabled video.
   * - `<div />` for participants with disabled video. This ref would point to
   * the VideoPlaceholder component.
   *
   * @param element the element ref.
   */
  setVideoElementRef?: (element: HTMLElement | null) => void;

  /**
   * An additional list of class names to append to the root DOM element.
   */
  className?: string;

  /**
   * The position of the toggle button menu, relative to its button element.
   */
  toggleMenuPosition?: 'top' | 'bottom';
}

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

export const ParticipantBox = (props: ParticipantBoxProps) => {
  const {
    participant,
    indicatorsVisible = true,
    videoKind = 'video',
    call,
    sinkId,
    muteAudio,
    setVideoElementRef,
    className,
    toggleMenuPosition = 'bottom',
  } = props;

  const {
    audioStream,
    videoStream,
    isLoggedInUser: isLocalParticipant,
    isDominantSpeaker,
    isSpeaking,
    publishedTracks,
    connectionQuality,
    sessionId,
    reaction,
  } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isPinned = !!participant.pinnedAt;

  const [trackedElement, setTrackedElement] = useState<HTMLDivElement | null>(
    null,
  );

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

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
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      call.state.updateParticipant(sessionId, (p) => ({
        ...p,
        viewportVisibilityState: VisibilityState.UNKNOWN,
      }));
    };
  }, [trackedElement, call.viewportTracker, call.state, sessionId]);

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
        !hasVideo && 'str-video__participant--no-video',
        !hasAudio && 'str-video__participant--no-audio',
        className,
      )}
      ref={setTrackedElement}
    >
      <MenuToggle
        strategy="fixed"
        placement={toggleMenuPosition === 'top' ? 'top-end' : 'bottom-end'}
        ToggleButton={ToggleButton}
      >
        <ParticipantActionsContextMenu participant={participant} />
      </MenuToggle>

      <div className="str-video__video-container">
        <Audio
          // mute the local participant, as we don't want to hear ourselves
          muted={participant.isLoggedInUser || muteAudio}
          sinkId={sinkId}
          audioStream={audioStream}
        />
        <Video
          call={call}
          participant={participant}
          kind={videoKind}
          setVideoElementRef={setVideoElementRef}
          className={clsx('str-video__remote-video', {
            'str-video__remote-video--mirror':
              isLocalParticipant && videoKind === 'video',
            'str-video__screen-share': videoKind === 'screen',
          })}
          // mute the local participant, as we don't want to hear ourselves
          muted={participant.isLoggedInUser}
          autoPlay
        />
        {reaction && (
          <Reaction reaction={reaction} sessionId={sessionId} call={call} />
        )}
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.name || participant.userId}
            {indicatorsVisible && isDominantSpeaker && (
              <span
                className="str-video__participant_name--dominant_speaker"
                title="Dominant speaker"
              />
            )}
            {indicatorsVisible && (
              <Notification
                isVisible={
                  isLocalParticipant &&
                  connectionQuality === SfuModels.ConnectionQuality.POOR
                }
                message="Poor connection quality. Please check your internet connection."
              >
                {connectionQualityAsString && (
                  <span
                    className={clsx(
                      'str-video__participant__connection-quality',
                      `str-video__participant__connection-quality--${connectionQualityAsString}`,
                    )}
                    title={connectionQualityAsString}
                  />
                )}
              </Notification>
            )}
            {indicatorsVisible && !hasAudio && (
              <span className="str-video__participant_name--audio-muted"></span>
            )}
            {indicatorsVisible && !hasVideo && (
              <span className="str-video__participant_name--video-muted"></span>
            )}
            {indicatorsVisible && isPinned && (
              // TODO: remove this monstrosity once we have a proper design
              <span
                title="Unpin"
                onClick={() =>
                  call.setParticipantPinnedAt(participant.sessionId)
                }
                style={{ cursor: 'pointer' }}
                className="str-video__participant_name--pinned"
              ></span>
            )}
          </span>
          {isDebugMode && (
            <>
              <DebugParticipantPublishQuality
                participant={participant}
                call={call}
              />
              <DebugStatsView
                call={call}
                kind={isLocalParticipant ? 'publisher' : 'subscriber'}
                mediaStream={videoStream}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
