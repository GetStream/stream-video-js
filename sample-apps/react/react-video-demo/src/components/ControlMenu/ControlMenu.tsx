import { FC, useCallback } from 'react';
import classnames from 'classnames';
import {
  SfuModels,
  useAudioPublisher,
  useLocalParticipant,
  useMediaDevices,
  useVideoPublisher,
} from '@stream-io/video-react-sdk';

import ControlButton from '../ControlButton';
import ControlMenuPanel from '../ControlMenuPanel';
import Portal from '../Portal';

import { Mic, MicMuted, Speaker, Video, VideoOff } from '../Icons';

import styles from './ControlMenu.module.css';

export type Props = {
  className?: string;
  call?: any;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  preview?: boolean;
};

export const ControlMenu: FC<Props> = ({
  className,
  call,
  initialAudioMuted,
  initialVideoMuted,
  preview,
}) => {
  const {
    selectedAudioInputDeviceId,
    selectedVideoDeviceId,
    selectedAudioOutputDeviceId,
    audioInputDevices,
    audioOutputDevices,
    videoDevices,
    switchDevice,
    toggleAudioMuteState,
    toggleVideoMuteState,
    initialVideoState,
    initialAudioEnabled,
    isAudioOutputChangeSupported,
  } = useMediaDevices();

  const localParticipant = useLocalParticipant();

  const isVideoMuted = preview
    ? !initialVideoState.enabled
    : !localParticipant?.publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const isAudioMuted = preview
    ? !initialAudioEnabled
    : !localParticipant?.publishedTracks.includes(SfuModels.TrackType.AUDIO);

  const publishVideoStream = useVideoPublisher({
    call: call,
    initialVideoMuted,
    videoDeviceId: selectedVideoDeviceId,
  });

  const publishAudioStream = useAudioPublisher({
    call: call,
    initialAudioMuted,
    audioDeviceId: selectedAudioInputDeviceId,
  });

  const disableVideo = useCallback(() => {
    call.stopPublish(SfuModels.TrackType.VIDEO);
  }, [call]);

  const enableVideo = useCallback(() => {
    publishVideoStream();
  }, [publishVideoStream]);

  const disableAudio = useCallback(() => {
    call.stopPublish(SfuModels.TrackType.AUDIO);
  }, [call]);

  const enableAudio = useCallback(() => {
    publishAudioStream();
  }, [publishAudioStream]);

  const video = useCallback(() => {
    if (preview) {
      toggleVideoMuteState();
    } else {
      isVideoMuted ? enableVideo() : disableVideo();
    }
  }, [localParticipant, isVideoMuted, preview]);

  const audio = useCallback(() => {
    if (preview) {
      toggleAudioMuteState();
    } else {
      isAudioMuted ? enableAudio() : disableAudio();
    }
  }, [localParticipant, isAudioMuted, preview]);

  const rootClassName = classnames(styles.root, className);

  return (
    <div className={rootClassName}>
      {isAudioOutputChangeSupported ? (
        <ControlButton
          className={styles.speakerButton}
          prefix={<Speaker />}
          portalId="audio-output-settings"
          label="Audio"
          panel={
            <Portal
              className={styles.audioSettings}
              selector="audio-output-settings"
            >
              <ControlMenuPanel
                className={styles.panel}
                selectedDeviceId={selectedAudioOutputDeviceId}
                selectDevice={switchDevice}
                devices={audioOutputDevices}
                title="Select an Audio Output"
                label="Audio output settings"
              />
            </Portal>
          }
        />
      ) : null}

      <ControlButton
        className={styles.audioButton}
        onClick={audio}
        prefix={isAudioMuted ? <MicMuted /> : <Mic />}
        portalId="audio-settings"
        label="Mic"
        panel={
          <Portal className={styles.audioSettings} selector="audio-settings">
            <ControlMenuPanel
              className={styles.panel}
              selectedDeviceId={selectedAudioInputDeviceId}
              selectDevice={switchDevice}
              devices={audioInputDevices}
              title="Select an Audio Input"
              label="Audio input settings"
            />
          </Portal>
        }
      />

      <ControlButton
        className={styles.videoButton}
        onClick={video}
        prefix={isVideoMuted ? <VideoOff /> : <Video />}
        portalId="camera-settings"
        label="Video"
        panel={
          <Portal className={styles.cameraSettings} selector="camera-settings">
            <ControlMenuPanel
              className={styles.panel}
              selectedDeviceId={selectedVideoDeviceId}
              selectDevice={switchDevice}
              devices={videoDevices}
              title="Select a Camera"
              label="Camera Settings"
            />
          </Portal>
        }
      />
    </div>
  );
};
