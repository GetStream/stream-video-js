import { useCall } from '../contexts';
import { Call, CameraManagerState } from '@stream-io/video-client';

import { useObservableValue } from './helpers/useObservableValue';

export const useCameraState = () => {
  const call = useCall();

  const {
    camera = {
      state: new CameraManagerState(),
    },
  } = call as Call;

  const status = useObservableValue(camera.state.status$);
  const direction = useObservableValue(camera.state.direction$);

  return {
    status,
    direction,
  };
};
