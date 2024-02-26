import { Call } from '../Call';
import { Dispatcher } from '../rtc';
import { CallState } from '../store';
import {
  handleRemoteSoftMute,
  watchAudioLevelChanged,
  watchCallAccepted,
  watchCallEnded,
  watchCallGrantsUpdated,
  watchCallRejected,
  watchChangePublishQuality,
  watchConnectionQualityChanged,
  watchDominantSpeakerChanged,
  watchLiveEnded,
  watchParticipantCountChanged,
  watchParticipantJoined,
  watchParticipantLeft,
  watchPinsUpdated,
  watchSfuErrorReports,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../events';
import {
  AllCallEvents,
  AllClientCallEvents,
  CallEventListener,
} from '../coordinator/connection/types';

type RingCallEvents = Extract<
  AllClientCallEvents,
  'call.accepted' | 'call.rejected'
>;

/**
 * Registers the default event handlers for a call during its lifecycle.
 *
 * @param call the call to register event handlers for.
 * @param state the call state.
 * @param dispatcher the dispatcher.
 */
export const registerEventHandlers = (
  call: Call,
  state: CallState,
  dispatcher: Dispatcher,
) => {
  const eventHandlers = [
    call.on('call.ended', watchCallEnded(call)),

    watchLiveEnded(dispatcher, call),
    watchSfuErrorReports(dispatcher),
    watchChangePublishQuality(dispatcher, call),
    watchConnectionQualityChanged(dispatcher, state),
    watchParticipantCountChanged(dispatcher, state),

    call.on('participantJoined', watchParticipantJoined(state)),
    call.on('participantLeft', watchParticipantLeft(state)),

    call.on('trackPublished', watchTrackPublished(state)),
    call.on('trackUnpublished', watchTrackUnpublished(state)),

    watchAudioLevelChanged(dispatcher, state),
    watchDominantSpeakerChanged(dispatcher, state),

    call.on('callGrantsUpdated', watchCallGrantsUpdated(state)),
    call.on('pinsUpdated', watchPinsUpdated(state)),

    handleRemoteSoftMute(call),
  ];

  if (call.ringing) {
    // these events are only relevant when the call is ringing
    eventHandlers.push(registerRingingCallEventHandlers(call));
  }

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
  const coordinatorRingEvents: {
    [key in RingCallEvents]: (
      call: Call,
    ) => CallEventListener<AllCallEvents[key]>;
  } = {
    'call.accepted': watchCallAccepted(call),
    'call.rejected': watchCallRejected(call),
  };

  const eventHandlers = Object.keys(coordinatorRingEvents).map((event) => {
    const eventName = event as RingCallEvents;
    return call.on(eventName, coordinatorRingEvents[eventName]);
  });

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};
