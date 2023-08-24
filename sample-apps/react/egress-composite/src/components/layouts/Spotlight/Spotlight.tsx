import {
  DefaultParticipantViewUI,
  SpeakerLayout,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './Spotlight.scss';

export const Spotlight = () => {
  const {
    options: { 'layout.spotlight.bar_position': barPosition = 'bottom' },
  } = useConfigurationContext();

  return (
    <div className="spotlight">
      <SpeakerLayout
        participantsBarPosition={barPosition}
        ParticipantViewUIBar={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        ParticipantViewUISpotlight={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
      />
    </div>
  );
};
