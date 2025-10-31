import { useEffect, useRef } from 'react';
import {
  CallTypes,
  combineComparators,
  DefaultParticipantViewUI,
  defaultSortPreset,
  dominantSpeaker,
  ParticipantsAudio,
  ParticipantView,
  pinned,
  publishingAudio,
  publishingVideo,
  reactionType,
  screenSharing,
  SfuModels,
  speaking,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { useSpotlightParticipant } from './useSpotlightParticipant';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';

import './DominantSpeaker.scss';

export const DominantSpeaker = () => {
  const call = useCall();
  const speakerInSpotlight = useSpotlightParticipant();
  const lastSpeakerInSpotlight = useRef<StreamVideoParticipant | null>(null);
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();
  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      speakerInSpotlight!,
      SfuModels.TrackType.VIDEO,
    );

  useEffect(() => {
    if (!call) return;
    const comparator = combineComparators(
      screenSharing,
      pinned,
      dominantSpeaker,
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    );
    call.setSortParticipantsBy(comparator);
    return () => {
      // reset the sorting to the default for the call type
      const callConfig = CallTypes.get(call.type);
      const preset = callConfig.options.sortParticipantsBy || defaultSortPreset;
      call.setSortParticipantsBy(preset);
    };
  }, [call]);

  useEffect(() => {
    if (!call || !speakerInSpotlight) return;

    const sessionId = lastSpeakerInSpotlight.current?.sessionId;
    if (speakerInSpotlight.sessionId === sessionId) return;

    const tag = 'recorder.dominant_speaker_layout.spotlight_speaker_changed';
    call.tracer.trace(tag, speakerInSpotlight);

    lastSpeakerInSpotlight.current = speakerInSpotlight;
  }, [call, speakerInSpotlight]);

  if (!call) return <h2>No active call</h2>;
  return (
    <div
      className="eca__dominant-speaker__container"
      data-testid="single-participant"
    >
      <ParticipantsAudio participants={remoteParticipants} />
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
