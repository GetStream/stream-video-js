import { useCall } from '../contexts';
import { Call } from '@stream-io/video-client';

import { useObservableValue } from './useObservableValue';
import { MicrophoneManagerState } from '@stream-io/video-client';

export const useMicrophoneState = () => {
  const call = useCall();

  const {
    microphone = {
      state: new MicrophoneManagerState(),
    },
  } = call as Call;

  const status = useObservableValue(microphone.state.status$);
  const selectedDevice = useObservableValue(microphone.state.selectedDevice$);

  return {
    status,
    selectedDevice,
  };
};
