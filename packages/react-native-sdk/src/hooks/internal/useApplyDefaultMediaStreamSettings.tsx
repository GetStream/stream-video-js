import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';

/**
 * Hook when used applies the default call media stream audio/video settings.
 */
export const useApplyDefaultMediaStreamSettings = () => {
  const {
    useCameraState,
    useMicrophoneState,
    useCallSettings,
    useCallCallingState,
  } = useCallStateHooks();
  const callSettings = useCallSettings();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  const callingState = useCallCallingState();

  // Effect to apply the call settings to the Lobby View
  useEffect(() => {
    if (!callSettings) {
      return;
    }
    if (callingState === CallingState.LEFT) {
      return;
    }
    const applyMediaStreamState = async () => {
      const { audio, video } = callSettings;
      if (audio.mic_default_on) {
        await microphone.enable();
      }
      if (video.camera_default_on) {
        await camera.enable();
      }
    };
    applyMediaStreamState();
  }, [camera, microphone, callingState, callSettings]);
};
