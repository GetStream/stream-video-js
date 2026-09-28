import {
  DefaultParticipantViewUI,
  DefaultParticipantViewUIProps,
  StreamTheme,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';
import { useSettings } from '../context/SettingsContext';
import { AdaptivePipGrid } from './AdaptivePipGrid';

export function StagePip() {
  const {
    settings: { themeMode },
  } = useSettings();
  return (
    <StreamTheme theme={themeMode}>
      <div className="rd__stage-pip">
        <AdaptivePipGrid ParticipantViewUI={PipParticipantViewUI} />
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
