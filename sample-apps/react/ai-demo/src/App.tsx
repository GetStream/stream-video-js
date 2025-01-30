import { useEffect, useState } from 'react';
import { Aura } from './ components/Aura';
import { AiCaptions } from './ components/AiCaptions';
import { CallClosedCaption } from '@stream-io/video-react-sdk';

export function App() {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [captions, setCaptions] = useState<CallClosedCaption[]>([]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((ms) => setMediaStream(ms));
  }, []);

  return (
    <>
      {/* <Aura activity="listening" height={800} mediaStream={mediaStream} /> */}
      <AiCaptions captions={captions} />
      <button
        type="button"
        onClick={() =>
          setCaptions((captions) => [
            {
              start_time: Date.now().toString(),
              text: `Caption ${captions.length + 1}`,
            } as CallClosedCaption,
            ...captions,
          ])
        }
      >
        Add caption
      </button>
    </>
  );
}
