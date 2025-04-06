import {
  DefaultParticipantViewUI,
  DefaultParticipantViewUIProps,
  PipLayout,
  StreamTheme,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';

export function StagePip() {
  return (
    <StreamTheme>
      <div className="rd__stage-pip">
        <PipLayout.Pip ParticipantViewUI={PipParticipantViewUI} />
      </div>
      <div className="str-video__call-controls">
        <div className="str-video__call-controls--group str-video__call-controls--media">
          <ToggleAudioPublishingButton Menu={null as any} />
          <ToggleVideoPublishingButton Menu={null as any} />
        </div>
      </div>
    </StreamTheme>
  );
}

function PipParticipantViewUI(props: DefaultParticipantViewUIProps) {
  return <DefaultParticipantViewUI {...props} showMenuButton={false} />;
}
