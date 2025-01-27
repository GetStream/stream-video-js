import {
  Call,
  StreamCall,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { getConnectionString } from '../../lib/connectionString';

export function CallingState(props: { call: Call }) {
  return (
    <StreamCall call={props.call}>
      <CallingStateInner />
    </StreamCall>
  );
}

function CallingStateInner() {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const state = useCallCallingState();
  return (
    <div className="rd__calling-state" data-copy="In call" data-h>
      {call && <span data-copy={getConnectionString(call)} hidden />}
      {call?.cid ?? <>In call</>} - <span data-copyable>{state}</span>
    </div>
  );
}
