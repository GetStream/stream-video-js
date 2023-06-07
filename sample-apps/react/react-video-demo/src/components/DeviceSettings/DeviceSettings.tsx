import { FC, useCallback, useState } from 'react';

import {
  useMediaDevices,
  useAudioInputDevices,
  useAudioOutputDevices,
  useVideoDevices,
} from '@stream-io/video-react-sdk';

import { Cog } from '../Icons';

import SettingsMenu from '../SettingsMenu';
import DeviceList from '../DeviceList';
import Button from '../Button';

import { useModalContext } from '../../contexts/ModalContext';

import styles from './DeviceSettings.module.css';

export type Props = {
  className?: string;
};

export const DeviceSettings: FC<Props> = ({ className }) => {
  const {
    selectedVideoDeviceId,
    isAudioOutputChangeSupported,
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    switchDevice,
  } = useMediaDevices();
  const videoDevices = useVideoDevices();
  const audioInputDevices = useAudioInputDevices();
  const audioOutputDevices = useAudioOutputDevices();
  const { close } = useModalContext();

  const [audioInputId, setAudioInputId] = useState<string>();
  const [audioOutputId, setAudioOutputId] = useState<string>();
  const [videoInputId, setVideoInputId] = useState<string>();

  const handleSelectVideoDevice = useCallback(
    (_: string, videoDeviceId: string) => {
      setVideoInputId(videoDeviceId);
    },
    [],
  );

  const handleSelectAudioInputDevice = useCallback(
    (_: string, audioInputDeviceId: string) => {
      setAudioInputId(audioInputDeviceId);
    },
    [],
  );

  const handleSelectAudioOutputDevice = useCallback(
    (_: string, audioDeviceId: string) => {
      setAudioOutputId(audioDeviceId);
    },
    [],
  );

  const save = useCallback(async () => {
    if (videoInputId) {
      await switchDevice('videoinput', videoInputId);
    }

    if (audioInputId) {
      await switchDevice('audioinput', audioInputId);
    }

    if (audioOutputId && isAudioOutputChangeSupported) {
      await switchDevice('audiooutput', audioOutputId);
    }

    close();
  }, [audioInputId, audioOutputId, videoInputId, isAudioOutputChangeSupported]);

  return (
    <SettingsMenu className={styles.root} title="Settings" icon={<Cog />}>
      <DeviceList
        className={styles.video}
        title="Select a Camera"
        devices={videoDevices}
        selectedDeviceId={selectedVideoDeviceId}
        selectDevice={handleSelectVideoDevice}
      />
      {isAudioOutputChangeSupported ? (
        <DeviceList
          className={styles.audioOutput}
          title="Select an Audio Output"
          devices={audioOutputDevices}
          selectedDeviceId={selectedAudioOutputDeviceId}
          selectDevice={handleSelectAudioOutputDevice}
        />
      ) : null}
      <DeviceList
        className={styles.audioInput}
        title="Select an Audio Input"
        devices={audioInputDevices}
        selectedDeviceId={selectedAudioInputDeviceId}
        selectDevice={handleSelectAudioInputDevice}
      />
      <div className={styles.footer}>
        <Button
          className={styles.cancel}
          color="secondary"
          shape="oval"
          onClick={() => close()}
        >
          Cancel
        </Button>
        <Button
          className={styles.confirm}
          onClick={() => save()}
          color="primary"
          shape="oval"
        >
          Confirm
        </Button>
      </div>
    </SettingsMenu>
  );
};
