import { CallingState } from '../store';
import { Call } from '../Call';
import { OwnCapability } from '../gen/coordinator';
import { reconcileRingState } from '../ringing';
import { CallEnded } from '../gen/video/sfu/event/events';
import { CallEndedReason } from '../gen/video/sfu/models/models';

/**
 * Handles the delivery of `call.accepted`. The caller joins the call.
 *
 * `CallState.updateFromEvent` runs before this, so the reconciler reads the
 * event's data off the call state.
 */
export const watchCallAccepted = (call: Call) => {
  return async function onCallAccepted() {
    await reconcileRingState(call);
  };
};

/**
 * Handles the delivery of `call.rejected`. The caller cancels once everyone
 * has rejected, and a callee leaves once the caller has cancelled.
 */
export const watchCallRejected = (call: Call) => {
  return async function onCallRejected() {
    await reconcileRingState(call);
  };
};

/**
 * Handles the delivery of `call.missed`. The caller drops the call once
 * nobody can still accept it.
 */
export const watchCallMissed = (call: Call) => {
  return async function onCallMissed() {
    await reconcileRingState(call);
  };
};

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return function onCallEnded() {
    globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
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
        .leave({ message: 'call.ended event received', reject: false })
        .catch((err) => {
          call.logger.error('Failed to leave call after call.ended ', err);
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
