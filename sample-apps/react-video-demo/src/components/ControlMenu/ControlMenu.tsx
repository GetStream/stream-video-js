import { FC, useCallback, useState, useEffect } from 'react';
import classnames from 'classnames';

import {
  useVideoPublisher,
  useAudioPublisher,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { SfuModels } from '@stream-io/video-client';

import ControlButton from '../ControlButton';
import ControlMenuPanel from '../ControlMenuPanel';
import Portal from '../Portal';

import { Mic, MicMuted, Video, VideoOff } from '../Icons';

import styles from './ControlMenu.module.css';

// useEffect(() => {
//   const muted = !localParticipant?.publishedTracks.includes(
//     SfuModels.TrackType.VIDEO,
//   );

//   setVideoMuted(muted);
// }, [localParticipant]);

// useEffect(() => {
//   const muted = !localParticipant?.publishedTracks.includes(
//     SfuModels.TrackType.AUDIO,
//   );

//   setAudioMuted(muted);
// }, [localParticipant]);

export type Props = {
  className?: string;
  call?: any;
  localParticipant?: any;
  videoMuted?: boolean;
  audioMuted?: boolean;
};

export const ControlMenu: FC<Props> = ({
  className,
  call,
  localParticipant,
  videoMuted,
  audioMuted,
}) => {
  const {
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    audioDevices,
    videoDevices,
    switchDevice,
  } = useMediaDevices();

  const [isLoading, setIsLoading] = useState(true);

  const [isVideoMuted, setVideoMuted] = useState(true);
  const [isAudioMuted, setAudioMuted] = useState(true);

  const publishVideoStream = useVideoPublisher({
    call: call,
    initialVideoMuted: isVideoMuted,
    videoDeviceId: selectedVideoDeviceId,
  });

  const publishAudioStream = useAudioPublisher({
    call: call,
    initialAudioMuted: isAudioMuted,
    audioDeviceId: selectedAudioDeviceId,
  });

  const toggleVideo = useCallback(() => {
    if (isVideoMuted) {
      publishVideoStream();
      setVideoMuted(false);
    } else {
      call.stopPublish(SfuModels.TrackType.VIDEO);
      setVideoMuted(true);
    }
  }, [publishVideoStream, call, isVideoMuted]);

  const toggleAudio = useCallback(() => {
    if (isAudioMuted) {
      publishAudioStream();
      setAudioMuted(false);
    } else {
      call.stopPublish(SfuModels.TrackType.VIDEO);
      setAudioMuted(true);
    }
  }, [publishAudioStream, call, isAudioMuted]);

  useEffect(() => {
    if (call) {
      const muted = !localParticipant?.publishedTracks.includes(
        SfuModels.TrackType.VIDEO,
      );

      if (muted) {
        toggleVideo();
      }

      setIsLoading(false);
    }
  }, [call, localParticipant, toggleVideo]);

  const rootClassName = classnames(styles.root, className);

  return (
    <>
      <div id="portal" className={styles.portal}></div>
      <div className={rootClassName}>
        <ControlButton
          className={styles.videoButton}
          onClick={toggleVideo}
          state={isLoading ? 'disabled' : undefined}
          prefix={isVideoMuted ? <VideoOff /> : <Video />}
          panel={
            <Portal selector="#portal">
              <ControlMenuPanel
                className={styles.panel}
                selectedDeviceId={selectedVideoDeviceId}
                selectDevice={(kind: any, deviceId) =>
                  switchDevice(kind, deviceId)
                }
                devices={videoDevices}
                title="Select a Camera"
                label="Camera Settings"
              />
            </Portal>
          }
          label="Video"
        />
        <ControlButton
          className={styles.audioButton}
          onClick={toggleAudio}
          state={isLoading ? 'disabled' : undefined}
          prefix={isAudioMuted ? <MicMuted /> : <Mic />}
          panel={
            <Portal selector="#portal">
              <ControlMenuPanel
                className={styles.panel}
                selectedDeviceId={selectedAudioDeviceId}
                selectDevice={(kind: any, deviceId) =>
                  switchDevice(kind, deviceId)
                }
                devices={audioDevices}
                title="Select an Audio Output"
                label="Audio Settings"
              />
            </Portal>
          }
          label="Mic"
        />
      </div>
    </>
  );
};
