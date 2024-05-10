import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useMemo } from 'react';

/**
 * Hook when used applies the default call media stream audio/video settings.
 */
export const useApplyDefaultMediaStreamSettings = () => {
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  const call = useCall();

  /*
   * This is the object is used to track the initial audio/video enablement
   * Uses backend settings or the Prop to set initial audio/video enabled
   * Backend settings is applied only if the prop was undefined -- meaning user did not provide any value
   * Memoization is needed to avoid unnecessary useEffect triggers
   */
  const { initialAudioEnabled, initialVideoEnabled } = useMemo(() => {
    return {
      initialAudioEnabled: settings?.audio.mic_default_on,
      initialVideoEnabled: settings?.video.camera_default_on,
    };
  }, [settings?.audio.mic_default_on, settings?.video.camera_default_on]);

  useEffect(() => {
    if (initialAudioEnabled !== undefined) {
      if (initialAudioEnabled) {
        call?.microphone.enable();
      } else {
        call?.microphone.disable();
      }
    }

    if (initialVideoEnabled !== undefined) {
      if (initialVideoEnabled) {
        call?.camera.enable();
      } else {
        call?.camera.disable();
      }
    }
  }, [call, initialAudioEnabled, initialVideoEnabled]);
};
