import { FC, useCallback, useState } from 'react';
import classnames from 'classnames';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import ControlButton, { PanelButton } from '../ControlButton';
import ControlMenuPanel from '../ControlMenuPanel';
import Portal from '../Portal';
import { Mic, MicMuted, Speaker, Video, VideoOff } from '../Icons';

import styles from './ControlMenu.module.css';

export type Props = {
  className?: string;
};

export const ControlMenu: FC<Props> = ({ className }) => {
  const { useCameraState, useMicrophoneState, useSpeakerState } =
    useCallStateHooks();
  const {
    camera,
    isMute: isCameraMute,
    devices: cameraDevices,
    selectedDevice: selectedCameraId,
  } = useCameraState();
  const {
    microphone,
    isMute: isMicMute,
    selectedDevice: selectedMicId,
    devices: micDevices,
  } = useMicrophoneState();
  const {
    speaker,
    selectedDevice: selectedSpeakerId,
    devices: speakers,
    isDeviceSelectionSupported,
  } = useSpeakerState();

  const [isAudioOutputVisible, setAudioOutputVisible] = useState(false);
  const toggleAudioOutputPanel = useCallback(() => {
    setAudioOutputVisible(!isAudioOutputVisible);
  }, [isAudioOutputVisible]);

  return (
    <div className={classnames(styles.root, className)}>
      <ControlButton
        className={styles.audioButton}
        onClick={() => microphone.toggle()}
        prefix={isMicMute ? <MicMuted /> : <Mic />}
        portalId="audio-settings"
        label="Mic"
        panel={
          <Portal className={styles.audioSettings} selector="audio-settings">
            <ControlMenuPanel
              className={styles.panel}
              selectedDeviceId={selectedMicId}
              selectDevice={(deviceId) => microphone.select(deviceId)}
              devices={micDevices || []}
              title="Select an Audio Input"
            />
          </Portal>
        }
      />

      <ControlButton
        className={styles.videoButton}
        onClick={() => camera.toggle()}
        prefix={isCameraMute ? <VideoOff /> : <Video />}
        portalId="camera-settings"
        label="Video"
        panel={
          <Portal className={styles.cameraSettings} selector="camera-settings">
            <ControlMenuPanel
              className={styles.panel}
              selectedDeviceId={selectedCameraId}
              selectDevice={(deviceId) => camera.select(deviceId)}
              devices={cameraDevices || []}
              title="Select a Camera"
            />
          </Portal>
        }
      />

      {isDeviceSelectionSupported ? (
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
                selectedDeviceId={selectedSpeakerId}
                selectDevice={(deviceId) => speaker.select(deviceId)}
                devices={speakers || []}
                title="Select an Audio Output"
              />
            </Portal>
          }
        />
      ) : null}
    </div>
  );
};
