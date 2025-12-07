import { CallingState } from '@stream-io/video-client';
import { AcceptCallButton, CancelCallButton } from '../CallControls';
import { useCall, getCallStateHooks } from '@stream-io/video-react-bindings';

const { useCallCallingState } = getCallStateHooks();
export const RingingCallControls = () => {
  const call = useCall();
  const callCallingState = useCallCallingState();

  if (!call) return null;

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
