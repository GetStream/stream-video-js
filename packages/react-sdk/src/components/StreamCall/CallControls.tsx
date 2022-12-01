import clsx from 'clsx';
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { map } from 'rxjs';
import {
  Call,
  CallMeta,
  getAudioStream,
  getScreenShareStream,
  getVideoStream,
  SfuModels,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import {
  useLocalParticipant,
  useStreamVideoClient,
  useIsCallRecordingInProgress,
  useStore,
} from '@stream-io/video-react-bindings';
import { CallStats } from './CallStats';
import { useDebugPreferredVideoCodec } from '../Debug/useIsDebugMode';

export const CallControls = (props: {
  call: Call;
  callMeta?: CallMeta.Call;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
}) => {
  const { call, callMeta, initialAudioMuted, initialVideoMuted } = props;
  const client = useStreamVideoClient();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const localParticipant = useLocalParticipant();
  const { activeCallLocalParticipant$ } = useStore();
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const isScreenSharing = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  const audioDeviceId = localParticipant?.audioDeviceId;
  const videoDeviceId = localParticipant?.videoDeviceId;

  useEffect(() => {
    if (initialAudioMuted) return;
    getAudioStream(audioDeviceId).then((stream) => {
      return call.publishAudioStream(stream);
    });
  }, [call, audioDeviceId, initialAudioMuted]);

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    if (initialVideoMuted) return;
    getVideoStream(videoDeviceId).then((stream) => {
      return call.publishVideoStream(stream, { preferredCodec });
    });
  }, [videoDeviceId, call, preferredCodec, initialVideoMuted]);

  const publishAudioStream = useCallback(async () => {
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, videoDeviceId]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      activeCallLocalParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      await call.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [activeCallLocalParticipant$, call]);
  useEffect(() => {
    const subscription = watchForDisconnectedVideoDevice(
      activeCallLocalParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      await call.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [activeCallLocalParticipant$, call]);

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
            call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
          }
        }}
      />
      <Button
        icon={isAudioMute ? 'mic-off' : 'mic'}
        onClick={() => {
          if (isAudioMute) {
            void publishAudioStream();
          } else {
            call.stopPublish(SfuModels.TrackType.AUDIO);
          }
        }}
      />
      <Button
        icon={isVideoMute ? 'camera-off' : 'camera'}
        onClick={() => {
          if (isVideoMute) {
            void publishVideoStream();
          } else {
            call.stopPublish(SfuModels.TrackType.VIDEO);
          }
        }}
      />
      <Button
        icon="call-end"
        variant="danger"
        onClick={() => {
          call.leave();
          // FIXME: OL: move this away from here
          alert('Call ended. You may close the window now.');
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
