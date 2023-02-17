import { ParticipantBox, useActiveCall } from '@stream-io/video-react-sdk';
import { useSpotlightParticipant } from './useSpotlightParticipant';
import { LayoutComponent } from '../index';
import './Spotlight.scss';

export const DominantSpeaker: LayoutComponent = (props) => {
  const { setVideoElementRef } = props;
  const activeCall = useActiveCall();
  const speakerInSpotlight = useSpotlightParticipant();

  if (!activeCall) return <h2>No active call</h2>;
  return (
    <div className="spotlight-container">
      {speakerInSpotlight && (
        <ParticipantBox
          participant={speakerInSpotlight}
          call={activeCall}
          indicatorsVisible={false}
          setVideoElementRef={setVideoElementRef}
        />
      )}
    </div>
  );
};
