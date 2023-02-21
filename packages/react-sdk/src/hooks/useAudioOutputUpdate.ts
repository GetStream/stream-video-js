import { useActiveCall } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';

export type AudioUpdateParams = {
  audioOutputDeviceId?: string;
};
export const useAudioOutputUpdate = ({
  audioOutputDeviceId,
}: AudioUpdateParams) => {
  const activeCall = useActiveCall();

  useEffect(() => {
    activeCall?.setAudioOutputDevice(audioOutputDeviceId);
  }, [activeCall, audioOutputDeviceId]);
};
