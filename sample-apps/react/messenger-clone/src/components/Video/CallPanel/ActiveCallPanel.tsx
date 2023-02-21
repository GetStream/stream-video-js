import { ParticipantBox, useMediaDevices } from '@stream-io/video-react-sdk';
import {
  Call,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { ActiveCallControls } from './CallControls';
import { useConnectedUser } from '@stream-io/video-react-bindings';

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
  const {
    // @ts-expect-error
    imageUrl,
  } = useConnectedUser();

  const { publishAudioStream, publishVideoStream } = useMediaDevices();

  const remoteParticipantImage = remoteParticipant?.user?.image;

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
