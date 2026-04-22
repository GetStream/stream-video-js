import {
  DefaultParticipantViewUI,
  hasScreenShare,
  ParticipantsAudio,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { EgressReadinessProbe } from '../EgressReadyParticipantViewUI';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './DominantSpeakerScreenShare.scss';

export const DominantSpeakerScreenShare = () => {
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();

  const screensharingParticipant = participants.find((p) => hasScreenShare(p))!;

  const {
    options: {
      'layout.single-participant.presenter_visible': presenterVisible = true,
      'layout.forceMirrorParticipants': forceMirrorParticipants,
    },
  } = useConfigurationContext();

  return (
    <div
      className="eca__dominant-speaker-screen-share__container"
      data-testid="single-participant"
    >
      <ParticipantsAudio participants={participants} />
      <ParticipantView
        participant={screensharingParticipant}
        trackType="screenShareTrack"
        muteAudio // audio is handled by <ParticipantsAudio />
        ParticipantViewUI={<EgressReadinessProbe />}
      />
      {presenterVisible && (
        <div className="eca__dominant-speaker-screen-share__current-speaker">
          <ParticipantView
            participant={screensharingParticipant}
            mirror={forceMirrorParticipants}
            muteAudio // audio is handled by <ParticipantsAudio />
            ParticipantViewUI={
              <DefaultParticipantViewUI
                indicatorsVisible={false}
                showMenuButton={false}
              />
            }
          />
        </div>
      )}
    </div>
  );
};
