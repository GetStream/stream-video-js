import { Call } from '@stream-io/video-client';
import { useMediaDevices } from '../../contexts';
import {
  CallStatsButton,
  CancelCallButton,
  RecordCallButton,
  ScreenShareButton,
  ToggleAudioButton,
  ToggleCameraButton,
} from './index';
import { SpeakingWhileMutedNotification } from '../Notification';

export type CallControlsProps = {
  call: Call;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  onLeave?: () => void;
};

export const CallControls = (props: CallControlsProps) => {
  const { call, initialAudioMuted, initialVideoMuted, onLeave } = props;

  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();

  return (
    <div className="str-video__call-controls">
      <RecordCallButton call={call} />
      <CallStatsButton />
      <ScreenShareButton call={call} />
      <SpeakingWhileMutedNotification>
        <ToggleAudioButton
          call={call}
          audioDeviceId={selectedAudioDeviceId}
          initialAudioMuted={initialAudioMuted}
        />
      </SpeakingWhileMutedNotification>
      <ToggleCameraButton
        call={call}
        initialVideoMuted={initialVideoMuted}
        videoDeviceId={selectedVideoDeviceId}
      />
      <CancelCallButton call={call} onLeave={onLeave} />
    </div>
  );
};
