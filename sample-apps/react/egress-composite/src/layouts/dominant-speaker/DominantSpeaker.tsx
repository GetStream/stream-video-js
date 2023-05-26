import {
  DefaultParticipantViewUI,
  ParticipantView,
  SfuModels,
  useCall,
  useParticipants,
} from '@stream-io/video-react-sdk';
import { useSpotlightParticipant } from './useSpotlightParticipant';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './Spotlight.scss';
import { AudioTracks } from './AudioTracks';

export const DominantSpeaker = () => {
  const activeCall = useCall();
  const speakerInSpotlight = useSpotlightParticipant();
  const participants = useParticipants();
  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      speakerInSpotlight!,
      SfuModels.TrackType.VIDEO,
    );

  if (!activeCall) return <h2>No active call</h2>;
  return (
    <>
      <div className="spotlight-container">
        {speakerInSpotlight && (
          <ParticipantView
            participant={speakerInSpotlight}
            refs={{ setVideoElement, setVideoPlaceholderElement }}
            muteAudio
            ParticipantViewUI={
              <DefaultParticipantViewUI
                indicatorsVisible={false}
                showMenuButton={false}
              />
            }
          />
        )}
      </div>
      <AudioTracks
        participants={participants}
        dominantSpeaker={speakerInSpotlight}
      />
    </>
  );
};
