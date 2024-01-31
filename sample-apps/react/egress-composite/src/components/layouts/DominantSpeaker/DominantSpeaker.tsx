import {
  DefaultParticipantViewUI,
  ParticipantsAudio,
  ParticipantView,
  SfuModels,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { useSpotlightParticipant } from './useSpotlightParticipant';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';

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
    <div
      className="eca__dominant-speaker__container"
      data-testid="single-participant"
    >
      <ParticipantsAudio participants={participants} />
      {speakerInSpotlight && (
        <ParticipantView
          participant={speakerInSpotlight}
          refs={{ setVideoElement, setVideoPlaceholderElement }}
          muteAudio // audio is handled by <ParticipantsAudio />
          ParticipantViewUI={
            <DefaultParticipantViewUI
              indicatorsVisible={false}
              showMenuButton={false}
            />
          }
        />
      )}
    </div>
  );
};
