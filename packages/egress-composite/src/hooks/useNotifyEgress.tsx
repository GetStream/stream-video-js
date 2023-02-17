import { useEffect, useState } from 'react';

const NotificationElement = (props: { isReady?: boolean }) => {
  if (!props.isReady) return null;
  return <span id="egress-ready-for-capture"></span>;
};

export const useNotifyEgress = () => {
  const [isReady, setIsReady] = useState(false);
  const [videoElementRef, setVideoElementRef] =
    useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoElementRef) return;
    const onPlay = () => {
      console.log('Video Playing...');
      setIsReady(true);
    };
    videoElementRef.addEventListener('play', onPlay);
    return () => {
      setIsReady(false);
      videoElementRef.removeEventListener('play', onPlay);
    };
  }, [videoElementRef]);

  return {
    setVideoElementRef,
    NotificationBridgeElement: <NotificationElement isReady={isReady} />,
  };
};
