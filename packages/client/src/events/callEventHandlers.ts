import { Call } from '../Call';
import { Dispatcher } from '../rtc';
import {
  handleRemoteSoftMute,
  watchAudioLevelChanged,
  watchCallAccepted,
  watchCallEnded,
  watchCallGrantsUpdated,
  watchCallRejected,
  watchConnectionQualityChanged,
  watchDominantSpeakerChanged,
  watchInboundStateNotification,
  watchLiveEnded,
  watchParticipantCountChanged,
  watchParticipantJoined,
  watchParticipantLeft,
  watchParticipantUpdated,
  watchPinsUpdated,
  watchSfuCallEnded,
  watchSfuErrorReports,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../events';

/**
 * Registers the default event handlers for a call during its lifecycle.
 *
 * @param call the call to register event handlers for.
 * @param dispatcher the dispatcher.
 */
export const registerEventHandlers = (call: Call, dispatcher: Dispatcher) => {
  const state = call.state;
  // Read lazily on each event: setE2EEManager can run after setup() (an app that
  // inspects call settings via get()/getOrCreate() before deciding to encrypt has
  // already triggered it), so a value captured here would be a stale undefined
  // for the whole call and orphaned tracks would never get a decryptor.
  const e2ee = () => call.e2eeManager;

  const eventHandlers = [
    call.on('call.ended', watchCallEnded(call)),
    watchSfuCallEnded(call),

    watchLiveEnded(dispatcher, call),
    watchSfuErrorReports(dispatcher),
    watchConnectionQualityChanged(dispatcher, state),
    watchParticipantCountChanged(dispatcher, state),

    call.on('participantJoined', watchParticipantJoined(state, e2ee)),
    call.on('participantLeft', watchParticipantLeft(state)),
    call.on('participantUpdated', watchParticipantUpdated(state)),

    call.on('trackPublished', watchTrackPublished(state, e2ee)),
    call.on('trackUnpublished', watchTrackUnpublished(state, e2ee)),

    watchAudioLevelChanged(dispatcher, state),
    watchDominantSpeakerChanged(dispatcher, state),

    call.on('callGrantsUpdated', watchCallGrantsUpdated(state)),
    call.on('pinsUpdated', watchPinsUpdated(state)),
    call.on('inboundStateNotification', watchInboundStateNotification(state)),

    handleRemoteSoftMute(call),
  ];

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};

/**
 * Registers event handlers for a call that is of ringing type.
 *
 * @param call the call to register event handlers for.
 */
export const registerRingingCallEventHandlers = (call: Call) => {
  const eventHandlers = [
    call.on('call.accepted', watchCallAccepted(call)),
    call.on('call.rejected', watchCallRejected(call)),
  ];

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};
