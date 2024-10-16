import { useEffect, useState } from 'react';

export function usePictureInPictureState(videoElement?: HTMLVideoElement) {
  const [isPiP, setIsPiP] = useState(
    document.pictureInPictureElement === videoElement,
  );

  if (!videoElement && isPiP) setIsPiP(false);

  useEffect(() => {
    if (!videoElement) return;

    const handlePiP = () => {
      setIsPiP(document.pictureInPictureElement === videoElement);
    };

    videoElement.addEventListener('enterpictureinpicture', handlePiP);
    videoElement.addEventListener('leavepictureinpicture', handlePiP);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handlePiP);
      videoElement.removeEventListener('leavepictureinpicture', handlePiP);
    };
  }, [videoElement]);

  return isPiP;
}
