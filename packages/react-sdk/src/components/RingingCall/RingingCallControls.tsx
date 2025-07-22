import { CallingState, getLogger } from '@stream-io/video-client';
import { AcceptCallButton, CancelCallButton } from '../CallControls';
import {
  useCall,
  useCalls,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';

export const RingingCallControls = () => {
  const call = useCall();
  const calls = useCalls();
  const { useCallCallingState } = useCallStateHooks();
  const callCallingState = useCallCallingState();

  if (!call) return null;

  const joinedRingingCalls = calls.filter(
    (c) => c.ringing && c.state.callingState === CallingState.JOINED,
  );
  const alreadyInAnotherRingingCall = joinedRingingCalls.length > 0;

  // TODO: where to add config prop shouldRejectCallWhenBusy?
  const isCalleeBusy = alreadyInAnotherRingingCall; // && shouldRejectCallWhenBusy;
  const rejectReason = isCalleeBusy ? 'busy' : 'decline';

  const ringingCallToReject = calls.filter(
    (c) => c.ringing && c.state.callingState === CallingState.RINGING,
  );

  if (isCalleeBusy && ringingCallToReject?.length === 1) {
    try {
      ringingCallToReject[0]?.leave({ reject: true, reason: rejectReason });
    } catch (error) {
      const logger = getLogger(['RingingCallControls']);
      logger('error', 'Error rejecting Call when busy', error);
    }
    return null;
  }

  const buttonsDisabled = callCallingState !== CallingState.RINGING;
  return (
    <div className="str-video__pending-call-controls">
      {call.isCreatedByMe ? (
        <CancelCallButton disabled={buttonsDisabled} />
      ) : (
        <>
          <AcceptCallButton disabled={buttonsDisabled} />
          <CancelCallButton
            onClick={() => {
              const reason = call.isCreatedByMe ? 'cancel' : 'decline';
              call.leave({ reject: true, reason });
            }}
            disabled={buttonsDisabled}
          />
        </>
      )}
    </div>
  );
};
