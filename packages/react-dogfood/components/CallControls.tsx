import {
  CallControlsProps as DefaultCallControlsProps,
  CallStatsButton,
  CancelCallButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleCameraPublishingButton,
  ToggleParticipantListButton,
} from '@stream-io/video-react-sdk';

type CallControlsProps = DefaultCallControlsProps & {
  participantListEnabled: boolean;
  toggleShowParticipantList: () => void;
};

export const CallControls = (props: CallControlsProps) => {
  const { call, onLeave, participantListEnabled, toggleShowParticipantList } =
    props;

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
          <ToggleAudioPublishingButton />
        </SpeakingWhileMutedNotification>
        <ToggleCameraPublishingButton />
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
