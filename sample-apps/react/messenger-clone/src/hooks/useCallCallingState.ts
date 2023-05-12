import { useEffect, useState } from 'react';
import { Call, CallingState, RxUtils } from '@stream-io/video-react-sdk';

export const useCallCallingState = (call?: Call) => {
  const [value, setValue] = useState<CallingState | null>(() =>
    call ? RxUtils.getCurrentValue(call.state.callingState$) : null,
  );
  useEffect(() => {
    if (!call) return;
    const subscription = call.state.callingState$.subscribe(setValue);
    return () => {
      subscription.unsubscribe();
    };
  }, [call]);

  return value;
};
