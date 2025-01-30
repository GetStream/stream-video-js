import { useEffect, useState } from "react";
import { Aura } from "./Aura/Aura";
import { AiCaptions } from "./AiCaptions";

export function App() {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [captions, setCaptions] = useState<
    Array<{ key: string; text: string }>
  >([]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((ms) => setMediaStream(ms));
  }, []);

  return (
    <>
      {mediaStream && (
        <Aura persona="ai" height={800} mediaStream={mediaStream} />
      )}
      <AiCaptions captions={captions} />
      <button
        type="button"
        onClick={() =>
          setCaptions((captions) => [
            {
              key: Date.now().toString(),
              text: `Caption ${captions.length + 1}`,
            },
            ...captions,
          ])
        }
      >
        Add caption
      </button>
    </>
  );
}
