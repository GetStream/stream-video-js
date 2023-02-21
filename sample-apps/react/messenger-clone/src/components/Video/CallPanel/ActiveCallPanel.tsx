import { ParticipantBox, useMediaDevices } from '@stream-io/video-react-sdk';
import {
  Call,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { ActiveCallControls } from './CallControls';
import { useConnectedUser } from '@stream-io/video-react-bindings/dist/src/hooks/user';

type ActiveCallPanelProps = {
  activeCall: Call;
  localParticipant?: StreamVideoLocalParticipant;
  remoteParticipant?: StreamVideoParticipant;
};

export const ActiveCallPanel = ({
  activeCall,
  remoteParticipant,
  localParticipant,
}: ActiveCallPanelProps) => {
  const { imageUrl } = useConnectedUser();

  const { publishAudioStream, publishVideoStream } = useMediaDevices();

  const remoteParticipantImage = remoteParticipant
    ? Object.values(activeCall.data.users).find(
        (user) => user.id === remoteParticipant.userId,
      ).imageUrl
    : undefined;

  return (
    <div className="rmc__call-panel-backdrop">
      <div className="rmc__call-panel">
        <div className="rmc__secondary-participant-wrapper">
          {localParticipant && (
            <ParticipantBox
              isMuted={true}
              participant={localParticipant}
              call={activeCall}
            />
          )}
          {!localParticipant && (
            <ParticipantPlaceholder
              className="rmc__secondary-participant-placeholder"
              imageSrc={imageUrl}
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
