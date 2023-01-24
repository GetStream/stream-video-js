import { useState } from 'react';

export const Preview = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>();
  const [audioMuted, setAudioMuted] = useState();

  // useEffect(() => {
  //   navigator.mediaDevices.getUserMedia({ video: true }).then((ms) => {
  //     setMediaStream(ms);
  //   });
  // });

  return <div className="flex w-full h-full items-center justify-center"></div>;
};
