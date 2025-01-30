import { CSSProperties, PropsWithChildren, useEffect, useState } from 'react';

export function AuraVolumeter(
  props: PropsWithChildren<{ mediaStream: MediaStream | null }>,
) {
  const volume = useMediaStreamVolume(props.mediaStream);

  return (
    <div
      className="aura-volumeter"
      style={
        {
          '--aura-volumeter-scale': Math.min(1 + volume / 2, 1.05),
          '--aura-volumeter-brightness': Math.max(Math.min(1 + volume, 1.1), 1),
        } as CSSProperties
      }
    >
      {props.children}
    </div>
  );
}

function useMediaStreamVolume(mediaStream: MediaStream | null) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!mediaStream) {
      setVolume(0);
      return;
    }

    let audioContext: AudioContext;

    const promise = (async () => {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      const data = new Float32Array(analyser.fftSize);
      source.connect(analyser);

      const updateVolume = () => {
        analyser.getFloatTimeDomainData(data);
        const volume = Math.sqrt(
          data.reduce((acc, amp) => acc + (amp * amp) / data.length, 0),
        );
        setVolume(volume);
        return requestAnimationFrame(updateVolume);
      };

      return updateVolume();
    })();

    return () => {
      promise.then((handle) => {
        cancelAnimationFrame(handle);
        audioContext.close();
      });
    };
  }, [mediaStream]);

  return volume;
}
