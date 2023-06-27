import { useLayoutEffect, useState } from 'react';
import {
  createSoundDetector,
  DeviceSettings,
  disposeOfMediaStream,
  getAudioStream,
  IconButton,
  useMediaDevices,
  VideoPreview,
} from '@stream-io/video-react-sdk';

export const Preview = {
  SpeechIndicator: () => {
    const { selectedAudioInputDeviceId, initialAudioEnabled } =
      useMediaDevices();
    const [percentage, setPercentage] = useState<number>(0);

    useLayoutEffect(() => {
      let mediaStream: MediaStream | undefined;
      let interrupted = false;
      let disposeOfSoundDetector:
        | undefined
        | ReturnType<typeof createSoundDetector>;

      if (!initialAudioEnabled) return;

      getAudioStream({ deviceId: selectedAudioInputDeviceId }).then((ms) => {
        if (interrupted) return disposeOfMediaStream(ms);

        mediaStream = ms;

        disposeOfSoundDetector = createSoundDetector(
          ms,
          ({ audioLevel }) => {
            setPercentage(audioLevel);
          },
          { detectionFrequencyInMs: 50 },
        );
      });

      return () => {
        interrupted = true;
        disposeOfSoundDetector?.();
        if (mediaStream) disposeOfMediaStream(mediaStream);
        setPercentage(0);
      };
    }, [selectedAudioInputDeviceId, initialAudioEnabled]);

    return (
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex justify-center items-center">
        <div
          className="rounded-full bg-zinc-100 to-transparent w-full h-full
          "
          style={{ transform: `scale(${percentage / 100})` }}
        />
      </div>
    );
  },
  Layout: () => {
    const {
      toggleInitialAudioMuteState,
      toggleInitialVideoMuteState,
      initialAudioEnabled,
      initialVideoState,
    } = useMediaDevices();

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
              icon={!initialAudioEnabled ? 'mic-off' : 'mic'}
              onClick={toggleInitialAudioMuteState}
            />
            <IconButton
              icon={!initialVideoState.enabled ? 'camera-off' : 'camera'}
              onClick={toggleInitialVideoMuteState}
            />
          </div>
        </div>
      </>
    );
  },
};
