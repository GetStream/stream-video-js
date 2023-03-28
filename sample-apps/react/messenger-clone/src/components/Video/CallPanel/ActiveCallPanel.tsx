import {
  Call,
  ParticipantBox,
  useConnectedUser,
  useLocalParticipant,
  useMediaDevices,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { ActiveCallControls } from './CallControls';

type ActiveCallPanelProps = {
  activeCall: Call;
};

export const ActiveCallPanel = ({ activeCall }: ActiveCallPanelProps) => {
  const user = useConnectedUser();
  const localParticipant = useLocalParticipant();
  const [remoteParticipant] = useRemoteParticipants();
  const { publishAudioStream, publishVideoStream } = useMediaDevices();

  const remoteParticipantImage = remoteParticipant?.image;

  return (
    <div className="rmc__call-panel-backdrop">
      <div className="rmc__call-panel">
        <div className="rmc__secondary-participant-wrapper">
          {localParticipant && (
            <ParticipantBox participant={localParticipant} call={activeCall} />
          )}
          {!localParticipant && (
            <ParticipantPlaceholder
              className="rmc__secondary-participant-placeholder"
              imageSrc={user?.image}
            />
          )}
        </div>

        <div className="rmc__primary-participant-wrapper">
          {remoteParticipant && (
            <ParticipantBox participant={remoteParticipant} call={activeCall} />
          )}
          {!remoteParticipant && (
            <ParticipantPlaceholder
              className="rmc__primary-participant-placeholder"
              imageSrc={remoteParticipantImage}
            />
          )}
        </div>

        <ActiveCallControls
          activeCall={activeCall}
          localParticipant={localParticipant}
          publishAudioStream={publishAudioStream}
          publishVideoStream={publishVideoStream}
        />
      </div>
    </div>
  );
};
