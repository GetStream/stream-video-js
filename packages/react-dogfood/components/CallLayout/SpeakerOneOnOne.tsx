import { useRef } from 'react';
import {
  SpeakerLayout,
  useParticipants,
  useHasOngoingScreenShare,
  ParticipantView,
  DefaultParticipantViewUI,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import { motion } from 'framer-motion';

const CustomParticipantViewUISpotlight = () => {
  const [participantInSpotlight, otherParticipant] = useParticipants();
  const constraintsElementRef = useRef<HTMLDivElement | null>(null);
  const hasOngoingScreenShare = useHasOngoingScreenShare();

  const participantToRender =
    hasOngoingScreenShare && !participantInSpotlight.isLoggedInUser
      ? participantInSpotlight
      : otherParticipant;

  return (
    <>
      <motion.div
        ref={constraintsElementRef}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
      >
        <motion.div
          dragConstraints={constraintsElementRef}
          className="rd__framer-participant-view-wrapper"
          drag
          dragMomentum
          dragTransition={{ timeConstant: 100, power: 0.1 }}
          dragElastic={0}
        >
          <ParticipantView
            muteAudio={participantToRender.isLoggedInUser}
            participant={participantToRender}
          />
        </motion.div>
      </motion.div>
      <DefaultParticipantViewUI />
    </>
  );
};

export const SpeakerOneOnOne = () => {
  const otherParticipants = useRemoteParticipants();
  const isOneOnOneCall = otherParticipants.length === 1;

  return (
    <SpeakerLayout
      ParticipantViewUISpotlight={
        isOneOnOneCall ? CustomParticipantViewUISpotlight : undefined
      }
      participantsBarPosition={isOneOnOneCall ? null : 'bottom'}
    />
  );
};
