import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDeviceList } from '../../hooks';
import { useMenuContext } from '../Menu';
import { DeviceSelector } from './DeviceSelector';
import { AudioVolumeIndicator } from './AudioVolumeIndicator';
import { DeviceLevelIndicator } from './DeviceLevelIndicator';
import { SpeakerTest } from './SpeakerTest';

export type DeviceSelectorAudioInputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown' | 'preview';
  volumeIndicatorVisible?: boolean;
};

export const DeviceSelectorAudioInput = ({
  title,
  visualType,
  volumeIndicatorVisible = true,
}: DeviceSelectorAudioInputProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, selectedDevice, devices } = useMicrophoneState();

  if (visualType === 'preview') {
    return (
      <DeviceSelectorAudioPreview
        devices={devices || []}
        selectedDeviceId={selectedDevice}
        title={title}
        onChange={async (deviceId) => {
          await microphone.select(deviceId);
        }}
      />
    );
  }

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      type="audioinput"
      onChange={async (deviceId) => {
        await microphone.select(deviceId);
      }}
      title={title}
      visualType={visualType}
      icon="mic"
    >
      {volumeIndicatorVisible && (
        <>
          <hr className="str-video__device-settings__separator" />
          <AudioVolumeIndicator />
        </>
      )}
    </DeviceSelector>
  );
};

const DeviceSelectorAudioPreview = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
}) => {
  const { devices = [], selectedDeviceId, title, onChange } = props;
  const { close } = useMenuContext();
  const { deviceList } = useDeviceList(devices, selectedDeviceId);

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title str-video__device-settings__device-selector-title--truncate">
          {title}
        </div>
      )}
      {deviceList.map((device) => {
        if (device.deviceId === 'default') return null;

        return (
          <label
            key={device.deviceId}
            className={`str-video__device-settings__option${device.isSelected ? ' str-video__device-settings__option--selected' : ''}`}
            htmlFor={`audioinput--${device.deviceId}`}
          >
            <input
              type="radio"
              name="audioinput"
              value={device.deviceId}
              id={`audioinput--${device.deviceId}`}
              checked={device.isSelected}
              onChange={(e) => {
                onChange?.(e.target.value);
                close?.();
              }}
            />
            {device.label}
            <DeviceLevelIndicator deviceId={device.deviceId} />
          </label>
        );
      })}
    </div>
  );
};

export type DeviceSelectorAudioOutputProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
  speakerTestVisible?: boolean;
  speakerTestAudioUrl?: string;
};

export const DeviceSelectorAudioOutput = ({
  title,
  visualType,
  speakerTestVisible = true,
  speakerTestAudioUrl,
}: DeviceSelectorAudioOutputProps) => {
  const { useSpeakerState } = useCallStateHooks();
  const { speaker, selectedDevice, devices, isDeviceSelectionSupported } =
    useSpeakerState();

  if (!isDeviceSelectionSupported) return null;

  return (
    <DeviceSelector
      devices={devices}
      type="audiooutput"
      selectedDeviceId={selectedDevice}
      onChange={(deviceId) => {
        speaker.select(deviceId);
      }}
      title={title}
      visualType={visualType}
      icon="speaker"
    >
      {speakerTestVisible && (
        <>
          <hr className="str-video__device-settings__separator" />
          <SpeakerTest audioUrl={speakerTestAudioUrl} />
        </>
      )}
    </DeviceSelector>
  );
};
