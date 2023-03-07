import { useEffect, useState } from 'react';
import {
  ParticipantBox,
  useActiveCall,
  SfuModels,
} from '@stream-io/video-react-sdk';
import { useSpotlightParticipant } from './useSpotlightParticipant';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './Spotlight.scss';

export const DominantSpeaker = () => {
  const activeCall = useActiveCall();
  const speakerInSpotlight = useSpotlightParticipant();
  const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts(
    speakerInSpotlight!,
    SfuModels.TrackType.VIDEO,
  );

  if (!activeCall) return <h2>No active call</h2>;
  return (
    <div className="spotlight-container">
      {speakerInSpotlight && (
        <ParticipantBox
          participant={speakerInSpotlight}
          call={activeCall}
          indicatorsVisible={false}
          setVideoElementRef={setParticipantVideoRef}
        />
      )}
    </div>
  );
};
