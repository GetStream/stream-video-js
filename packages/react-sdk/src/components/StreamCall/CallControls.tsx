import clsx from 'clsx';
import { ForwardedRef, forwardRef, useRef, useState } from 'react';
import { Call, getScreenShareStream, SfuModels } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useStreamVideoClient,
  useIsCallRecordingInProgress,
} from '@stream-io/video-react-bindings';
import { CallStats } from './CallStats';
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

  // const audioDeviceId = localParticipant?.audioDeviceId;
  // const videoDeviceId = localParticipant?.videoDeviceId;
  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();

  const { publishAudioStream, publishVideoStream } = useMediaPublisher({
    call,
    initialAudioMuted,
    initialVideoMuted,
    audioDeviceId: selectedAudioDeviceId,
    videoDeviceId: selectedVideoDeviceId,
  });


  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);
  useEffect(() => {
    // do nothing when unmute
    if (!isAudioMute || !audioDeviceId) return;
    let disposeSpeechDetector: ReturnType<typeof createSpeechDetector>;
    const notifySpeakingWhileMuted = async () => {
      const audioStream = await getAudioStream(audioDeviceId);
      disposeSpeechDetector = createSpeechDetector(
        audioStream,
        (isSpeechDetected) => {
          setIsSpeakingWhileMuted((isNotified) => {
            return isNotified ? isNotified : isSpeechDetected;
          });
        },
      );
    };

    notifySpeakingWhileMuted().catch((e) => {
      console.error(`Failed to notify speaking when muted`, e);
    });
    return () => {
      disposeSpeechDetector?.();
      setIsSpeakingWhileMuted(false);
    };
  }, [audioDeviceId, isAudioMute]);

  useEffect(() => {
    if (!isSpeakingWhileMuted) return;
    const timeout = setTimeout(() => {
      setIsSpeakingWhileMuted(false);
    }, 3500);
    return () => {
      clearTimeout(timeout);
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
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        className={clsx(
          'str-video__call-controls__button',
          icon && `str-video__call-controls__button--icon-${icon}`,
          variant && `str-video__call-controls__button--variant-${variant}`,
        )}
        ref={ref}
        {...rest}
      />
    );
  },
);
