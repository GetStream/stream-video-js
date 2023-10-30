import { useEffect, useState } from 'react';
import {
  createSoundDetector,
  DeviceSettings,
  IconButton,
  useCallStateHooks,
  VideoPreview,
} from '@stream-io/video-react-sdk';

export const Preview = {
  SpeechIndicator: () => {
    const { useMicrophoneState } = useCallStateHooks();
    const { isEnabled, mediaStream } = useMicrophoneState();
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
      if (!isEnabled || !mediaStream) return;

      const disposeSoundDetector = createSoundDetector(
        mediaStream,
        ({ audioLevel }) => setPercentage(audioLevel),
        { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
      );

      return () => {
        disposeSoundDetector().catch(console.error);
      };
    }, [isEnabled, mediaStream]);

    return (
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex justify-center items-center">
        <div
          className="rounded-full bg-zinc-100 to-transparent w-full h-full"
          style={{ transform: `scale(${percentage / 100})` }}
        />
      </div>
    );
  },
  Layout: () => {
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { isMute: isMicMute, microphone } = useMicrophoneState();
    const { isMute: isCameraMute, camera } = useCameraState();
    return (
      <>
        <div className="preview-layout relative lg:w-3/5 xl:w-1/4 w-full flex justify-center">
          <VideoPreview />
          <div className="absolute top-2 right-2 z-10 ">
            <DeviceSettings />
          </div>

          <div className="absolute bottom-2 left-2">
            <Preview.SpeechIndicator />
          </div>
        </div>

        <div className="flex justify-between items-center lg:w-3/5 xl:w-1/4 w-full">
          <div className="str-video__call-controls bg-zinc-700 rounded-full px-6">
            <IconButton
              icon={isMicMute ? 'mic-off' : 'mic'}
              onClick={() => microphone.toggle()}
            />
            <IconButton
              icon={isCameraMute ? 'camera-off' : 'camera'}
              onClick={() => camera.toggle()}
            />
          </div>
        </div>
      </>
    );
  },
};
