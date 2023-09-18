import { FC, useCallback, useState } from 'react';
import classnames from 'classnames';
import {
  SfuModels,
  useAudioInputDevices,
  useAudioOutputDevices,
  useCallStateHooks,
  useMediaDevices,
  useVideoDevices,
} from '@stream-io/video-react-sdk';

import ControlButton, { PanelButton } from '../ControlButton';
import ControlMenuPanel from '../ControlMenuPanel';
import Portal from '../Portal';
import { Mic, MicMuted, Speaker, Video, VideoOff } from '../Icons';

import styles from './ControlMenu.module.css';

export type Props = {
  className?: string;
  call?: any;
  preview?: boolean;
};

export const ControlMenu: FC<Props> = ({ className, call, preview }) => {
  const [isAudioOutputVisible, setAudioOutputVisible] = useState(false);
  const {
    selectedAudioInputDeviceId,
    selectedVideoDeviceId,
    selectedAudioOutputDeviceId,
    switchDevice,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
    publishVideoStream,
    publishAudioStream,
    initialVideoState,
    initialAudioEnabled,
    isAudioOutputChangeSupported,
  } = useMediaDevices();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const videoDevices = useVideoDevices();
  const audioInputDevices = useAudioInputDevices();
  const audioOutputDevices = useAudioOutputDevices();

  const isVideoMuted = preview
    ? !initialVideoState.enabled
    : !localParticipant?.publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const isAudioMuted = preview
    ? !initialAudioEnabled
    : !localParticipant?.publishedTracks.includes(SfuModels.TrackType.AUDIO);

  const disableVideo = useCallback(() => {
    call.stopPublish(SfuModels.TrackType.VIDEO);
  }, [call]);

  const enableVideo = useCallback(() => {
    publishVideoStream().catch((err) => {
      console.log(`Error while publishing video`, err);
    });
  }, [publishVideoStream]);

  const disableAudio = useCallback(() => {
    call.stopPublish(SfuModels.TrackType.AUDIO);
  }, [call]);

  const enableAudio = useCallback(() => {
    publishAudioStream().catch((err) => {
      console.log(`Error while publishing audio`, err);
    });
  }, [publishAudioStream]);

  const video = useCallback(() => {
    if (preview) {
      toggleInitialVideoMuteState();
    } else {
      isVideoMuted ? enableVideo() : disableVideo();
    }
  }, [
    preview,
    toggleInitialVideoMuteState,
    isVideoMuted,
    enableVideo,
    disableVideo,
  ]);

  const audio = useCallback(() => {
    if (preview) {
      toggleInitialAudioMuteState();
    } else {
      isAudioMuted ? enableAudio() : disableAudio();
    }
  }, [
    preview,
    toggleInitialAudioMuteState,
    isAudioMuted,
    enableAudio,
    disableAudio,
  ]);

  const toggleAudioOutputPanel = useCallback(() => {
    setAudioOutputVisible(!isAudioOutputVisible);
  }, [isAudioOutputVisible]);

  return (
    <div className={classnames(styles.root, className)}>
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
            />
          </Portal>
        }
      />

      {isAudioOutputChangeSupported ? (
        <PanelButton
          className={styles.speakerButton}
          prefix={<Speaker />}
          portalId="audio-output-settings"
          label="Audio"
          showPanel={isAudioOutputVisible}
          onClick={() => toggleAudioOutputPanel()}
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
              />
            </Portal>
          }
        />
      ) : null}
    </div>
  );
};
