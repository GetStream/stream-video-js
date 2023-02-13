import { FC, useCallback, useState, useEffect } from 'react';
import classnames from 'classnames';

import {
  useVideoPublisher,
  useAudioPublisher,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { SfuModels } from '@stream-io/video-client';

import ControlButton from '../ControlButton';
import SettingsMenu from '../SettingsMenu';
import Portal from '../Portal';

import { Mic, MicMuted, Video, VideoOff, Settings } from '../Icons';

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

export type PanelProps = {
  className?: string;
  selectedDeviceId?: string;
  devices: {
    deviceId: string;
    groupId: string;
    kind: MediaDeviceKind;
    label: string;
  }[];
  title: string;
  label: string;

  selectDevice: (kind: Partial<MediaDeviceKind>, deviceId: string) => void;
};

export const Panel: FC<PanelProps> = ({
  devices,
  title,
  label,
  className,
  selectedDeviceId,
  selectDevice,
}) => {
  return (
    <SettingsMenu className={className} title={title}>
      <ul className={styles.deviceList}>
        {devices.map(({ kind, label, deviceId }) => {
          const deviceClassName = classnames(styles.device, {
            [styles.selectedDevice]: selectedDeviceId === deviceId,
          });

          return (
            <li
              className={deviceClassName}
              onClick={() => selectDevice(kind, deviceId)}
            >
              <label className={styles.label} htmlFor={deviceId}>
                <input
                  id={kind}
                  className={styles.radioButton}
                  name={deviceId}
                  type="radio"
                  checked={selectedDeviceId === deviceId}
                  value={deviceId}
                />
                {label}
              </label>
            </li>
          );
        })}
      </ul>
      <div className={styles.footer}>
        <Settings />
        <p>{label}</p>
      </div>
    </SettingsMenu>
  );
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
  }, [call]);

  useEffect(() => {
    console.log('IS THE FFIN MUTED?', isVideoMuted);
  }, [isVideoMuted]);

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
    console.log('TOGGLE THE SHIT?', isVideoMuted, SfuModels);
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
              <Panel
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
        ></ControlButton>
        <ControlButton
          className={styles.audioButton}
          onClick={toggleAudio}
          state={isLoading ? 'disabled' : undefined}
          prefix={isAudioMuted ? <MicMuted /> : <Mic />}
          panel={
            <Portal selector="#portal">
              <Panel
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
        ></ControlButton>
      </div>
    </>
  );
};
