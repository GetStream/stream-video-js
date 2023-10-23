import { useCallback, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { Cog } from '../Icons';

import SettingsMenu from '../SettingsMenu';
import DeviceList from '../DeviceList';
import Button from '../Button';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './DeviceSettings.module.css';

export const DeviceSettings = () => {
  const { closeModal } = useModalContext();

  const [audioInputId, setAudioInputId] = useState<string>();
  const [audioOutputId, setAudioOutputId] = useState<string>();
  const [videoInputId, setVideoInputId] = useState<string>();

  const { useCameraState, useMicrophoneState, useSpeakerState } =
    useCallStateHooks();
  const cameraApi = useCameraState();
  const micApi = useMicrophoneState();
  const speakerApi = useSpeakerState();

  const save = useCallback(async () => {
    if (videoInputId) await cameraApi.camera.select(videoInputId);
    if (audioInputId) await micApi.microphone.select(audioInputId);
    if (audioOutputId && speakerApi.isDeviceSelectionSupported) {
      speakerApi.speaker.select(audioOutputId);
    }

    closeModal();
  }, [
    audioInputId,
    audioOutputId,
    closeModal,
    cameraApi.camera,
    micApi.microphone,
    speakerApi.isDeviceSelectionSupported,
    speakerApi.speaker,
    videoInputId,
  ]);

  return (
    <SettingsMenu className={styles.root} title="Settings" icon={<Cog />}>
      <DeviceList
        className={styles.video}
        title="Select a Camera"
        devices={cameraApi.devices || []}
        selectedDeviceId={cameraApi.selectedDevice}
        selectDevice={setVideoInputId}
      />
      {speakerApi.isDeviceSelectionSupported ? (
        <DeviceList
          className={styles.audioOutput}
          title="Select an Audio Output"
          devices={speakerApi.devices || []}
          selectedDeviceId={speakerApi.selectedDevice}
          selectDevice={setAudioOutputId}
        />
      ) : null}
      <DeviceList
        className={styles.audioInput}
        title="Select an Audio Input"
        devices={micApi.devices || []}
        selectedDeviceId={micApi.selectedDevice}
        selectDevice={setAudioInputId}
      />
      <div className={styles.footer}>
        <Button
          className={styles.cancel}
          color="secondary"
          shape="oval"
          onClick={closeModal}
        >
          Cancel
        </Button>
        <Button
          className={styles.confirm}
          onClick={save}
          color="primary"
          shape="oval"
        >
          Confirm
        </Button>
      </div>
    </SettingsMenu>
  );
};
