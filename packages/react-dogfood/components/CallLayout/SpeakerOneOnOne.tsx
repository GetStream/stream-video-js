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

  return (
    <>
      <motion.div
        ref={constraintsElementRef}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
      >
        <motion.div
          dragConstraints={constraintsElementRef}
          className="custom-participant-view"
          style={{
            position: 'absolute',
            width: '320px',
            top: '0.875rem',
            left: '0.875rem',
          }}
          drag
          dragMomentum
          dragTransition={{ timeConstant: 100, power: 0.1 }}
          dragElastic={0}
        >
          <ParticipantView
            muteAudio
            participant={
              hasOngoingScreenShare && !participantInSpotlight.isLoggedInUser
                ? participantInSpotlight
                : otherParticipant
            }
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
