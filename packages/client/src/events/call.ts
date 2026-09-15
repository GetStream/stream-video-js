import { CallingState } from '../store';
import { Call } from '../Call';
import { OwnCapability } from '../gen/coordinator';
import { CallEnded } from '../gen/video/sfu/event/events';
import { CallEndedReason } from '../gen/video/sfu/models/models';

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return function onCallEnded() {
    const { callingState } = call.state;
    if (
      callingState !== CallingState.IDLE &&
      callingState !== CallingState.LEFT
    ) {
      call.clientEventReporter.abort(call.cid, {
        code: 'BACKEND_LEAVE',
        reason: 'call.ended event received',
      });
      call
        .leave({
          message: 'call.ended event received',
          reject: false,
          reason: 'ended',
        })
        .catch((err) => {
          call.logger.error('Failed to leave call after call.ended', err);
        });
    }
  };
};

/**
 * Watches for `callEnded` events.
 */
export const watchSfuCallEnded = (call: Call) => {
  return call.on('callEnded', async (e: CallEnded) => {
    if (call.state.callingState === CallingState.LEFT) return;
    try {
      if (e.reason === CallEndedReason.LIVE_ENDED) {
        call.state.setBackstage(true);

        // don't leave the call if the user has permission to join backstage
        const { hasPermission } = call.permissionsContext;
        if (hasPermission(OwnCapability.JOIN_BACKSTAGE)) return;
      }
      // `call.ended` event arrived after the call is already left
      // and all event handlers are detached. We need to manually
      // update the call state to reflect the call has ended.
      call.state.setEndedAt(new Date());
      const reason = CallEndedReason[e.reason];
      globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
      call.clientEventReporter.abort(call.cid, {
        code: 'BACKEND_LEAVE',
        reason: `callEnded received: ${reason}`,
      });
      await call.leave({ message: `callEnded received: ${reason}` });
    } catch (err) {
      call.logger.error(
        'Failed to leave call after being ended by the SFU',
        err,
      );
    }
  });
};
