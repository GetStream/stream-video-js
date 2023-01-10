import clsx from 'clsx';
import { ForwardedRef, forwardRef, useEffect, useRef, useState } from 'react';
import {
  Call,
  createSoundDetector,
  getScreenShareStream,
  SfuModels,
} from '@stream-io/video-client';
import {
  useLocalParticipant,
  useStreamVideoClient,
  useIsCallRecordingInProgress,
} from '@stream-io/video-react-bindings';
import { CallStats } from './CallStats';
import { Notification } from './Notification';
import { useMediaPublisher } from '../../hooks';
import { useMediaDevices } from '../../contexts';

export const CallControls = (props: {
  call: Call;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  onLeave?: () => void;
}) => {
  const { call, initialAudioMuted, initialVideoMuted, onLeave } = props;
  const callMeta = call.data.call;
  const client = useStreamVideoClient();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const localParticipant = useLocalParticipant();
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const isScreenSharing = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  const { getAudioStream, selectedAudioDeviceId, selectedVideoDeviceId } =
    useMediaDevices();
  const { publishAudioStream, publishVideoStream } = useMediaPublisher({
    call,
    initialAudioMuted,
    initialVideoMuted,
    audioDeviceId: selectedAudioDeviceId,
    videoDeviceId: selectedVideoDeviceId,
  });

  const audioDeviceId = localParticipant?.audioDeviceId;
  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);
  useEffect(() => {
    // do nothing when not muted
    if (!isAudioMute) return;
    const disposeSoundDetector = getAudioStream(audioDeviceId).then(
      (audioStream) =>
        createSoundDetector(audioStream, (isSpeechDetected) => {
          setIsSpeakingWhileMuted((isNotified) =>
            isNotified ? isNotified : isSpeechDetected,
          );
        }),
    );
    disposeSoundDetector.catch((err) => {
      console.error('Error while creating sound detector', err);
    });
    return () => {
      disposeSoundDetector
        .then((dispose) => dispose())
        .catch((err) => {
          console.error('Error while disposing sound detector', err);
        });
      setIsSpeakingWhileMuted(false);
    };
  }, [audioDeviceId, getAudioStream, isAudioMute]);

  useEffect(() => {
    if (!isSpeakingWhileMuted) return;
    const timeout = setTimeout(() => {
      setIsSpeakingWhileMuted(false);
    }, 3500);
    return () => {
      clearTimeout(timeout);
      setIsSpeakingWhileMuted(false);
    };
  }, [isSpeakingWhileMuted]);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const statsAnchorRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="str-video__call-controls">
      <Button
        icon={isCallRecordingInProgress ? 'recording-on' : 'recording-off'}
        title="Record call"
        onClick={() => {
          if (!callMeta) return;
          if (isCallRecordingInProgress) {
            client?.stopRecording(callMeta.id, callMeta.type);
          } else {
            client?.startRecording(callMeta.id, callMeta.type);
          }
        }}
      />
      {isStatsOpen && (
        <CallStats
          anchor={statsAnchorRef.current!}
          onClose={() => {
            setIsStatsOpen(false);
          }}
        />
      )}
      <Button
        icon="stats"
        title="Statistics"
        ref={statsAnchorRef}
        onClick={() => {
          setIsStatsOpen((v) => !v);
        }}
      />
      <Button
        icon={isScreenSharing ? 'screen-share-on' : 'screen-share-off'}
        title="Share screen"
        onClick={async () => {
          if (!isScreenSharing) {
            const stream = await getScreenShareStream().catch((e) => {
              console.log(`Can't share screen: ${e}`);
            });
            if (stream) {
              await call.publishScreenShareStream(stream);
            }
          } else {
            await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
          }
        }}
      />
      <Notification
        message="You are muted. Unmute to speak."
        isVisible={isSpeakingWhileMuted}
      >
        <Button
          icon={isAudioMute ? 'mic-off' : 'mic'}
          onClick={() => {
            if (isAudioMute) {
              void publishAudioStream();
            } else {
              void call.stopPublish(SfuModels.TrackType.AUDIO);
            }
          }}
        />
      </Notification>
      <Button
        icon={isVideoMute ? 'camera-off' : 'camera'}
        onClick={() => {
          if (isVideoMute) {
            void publishVideoStream();
          } else {
            void call.stopPublish(SfuModels.TrackType.VIDEO);
          }
        }}
      />
      <Button
        icon="call-end"
        variant="danger"
        onClick={async () => {
          if (client && call.data.call?.callCid) {
            await client?.cancelCall(call.data.call?.callCid);
            onLeave?.();
          }
        }}
      />
    </div>
  );
};

const Button = forwardRef(
  (
    props: {
      icon: string;
      variant?: string;
      onClick?: () => void;
      [anyProp: string]: any;
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const { icon, variant, onClick, ...rest } = props;
    return (
      <button
        className={clsx(
          'str-video__call-controls__button',
          variant && `str-video__call-controls__button--variant-${variant}`,
        )}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        ref={ref}
        {...rest}
      >
        <span
          className={clsx(
            'str-video__call-controls__button--icon',
            icon && `str-video__call-controls__button--icon-${icon}`,
          )}
        ></span>
      </button>
    );
  },
);
