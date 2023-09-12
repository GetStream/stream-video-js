import {
  DefaultParticipantViewUI,
  ParticipantView,
  SfuModels,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useSpotlightParticipant } from './useSpotlightParticipant';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import { AudioTracks } from './AudioTracks';

import './DominantSpeaker.scss';

export const DominantSpeaker = () => {
  const activeCall = useCall();
  const speakerInSpotlight = useSpotlightParticipant();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      speakerInSpotlight!,
      SfuModels.TrackType.VIDEO,
    );

  if (!activeCall) return <h2>No active call</h2>;
  return (
    <>
      <div
        className="dominant-speaker__container"
        data-testid="single_participant"
      >
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
