import {
  CallControlsProps as DefaultCallControlsProps,
  CallStatsButton,
  CancelCallButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioButton,
  ToggleCameraButton,
  ToggleParticipantListButton,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

type CallControlsProps = DefaultCallControlsProps & {
  participantListEnabled: boolean;
  toggleShowParticipantList: () => void;
};

export const CallControls = (props: CallControlsProps) => {
  const {
    call,
    initialAudioMuted,
    initialVideoMuted,
    onLeave,
    participantListEnabled,
    toggleShowParticipantList,
  } = props;

  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();
  return (
    <div
      className="str-video__call-controls"
      data-testid="str-video__call-controls"
    >
      <div className="rd-call-controls-group">
        <RecordCallButton call={call} />
        <CallStatsButton />
        <ScreenShareButton call={call} />
      </div>
      <div className="rd-call-controls-group">
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
      <div className="rd-call-controls-group">
        <ToggleParticipantListButton
          enabled={participantListEnabled}
          onClick={toggleShowParticipantList}
        />
      </div>
    </div>
  );
};
