import type { SfuEvent } from '../gen/video/sfu/event/events';
import { Call } from './Call';
import { PeerType } from '../gen/video/sfu/models/models';
import { StreamVideoWriteableStateStore } from '../stateStore';

export const registerEventHandlers = (
  call: Call,
  store: StreamVideoWriteableStateStore,
) => {
  watchForPublishQualityChangeEvents(call);
  watchForParticipantEvents(call, store);
};

const watchForPublishQualityChangeEvents = (call: Call) => {
  call.on('changePublishQuality', (event: SfuEvent) => {
    if (event.eventPayload.oneofKind === 'changePublishQuality') {
      const { videoSenders } = event.eventPayload.changePublishQuality;
      videoSenders.forEach((videoSender) => {
        const { layers } = videoSender;
        call.updatePublishQuality(
          layers.filter((l) => l.active).map((l) => l.name),
        );
      });
    }
  });
};

const watchForParticipantEvents = (
  call: Call,
  store: StreamVideoWriteableStateStore,
) => {
  call.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;
    if (participant) {
      const participants = [
        ...store.getCurrentValue(store.activeCallParticipantsSubject),
      ];
      participants.push(participant);
      store.setCurrentValue(store.activeCallParticipantsSubject, participants);
    }
  });

  call.on('participantLeft', (e) => {
    if (e.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant } = e.eventPayload.participantLeft;
    if (participant) {
      let participants = store.getCurrentValue(
        store.activeCallParticipantsSubject,
      );
      participants = participants.filter(
        (p) =>
          p.user?.id !== participant.user?.id &&
          p.sessionId !== participant.sessionId,
      );
      store.setCurrentValue(store.activeCallParticipantsSubject, participants);
    }
  });
};

export const handleICETrickle = (call: Call) => async (e: SfuEvent) => {
  if (e.eventPayload.oneofKind !== 'iceTrickle') return;
  const { iceTrickle } = e.eventPayload;

  const candidate = JSON.parse(iceTrickle.iceCandidate);
  if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
    if (call.subscriber?.remoteDescription) {
      await call.subscriber?.addIceCandidate(candidate);
    } else {
      call.subscriberCandidates.push(candidate);
    }

    // enqueue ICE candidate if remote description is not set yet
    //https://stackoverflow.com/questions/38198751/domexception-error-processing-ice-candidate
  } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
    if (call.publisher?.remoteDescription) {
      await call.publisher.addIceCandidate(candidate);
    } else {
      call.publisherCandidates.push(candidate);
    }
  } else {
    console.warn(`ICETrickle, unknown peer type`, iceTrickle);
  }
};
