import { useState, useRef, useEffect } from 'react';
import { Call, SfuModels } from '@stream-io/video-client';

type VideoPlaceholderProps = {
  userId: string;
  imageSrc?: string;
  sessionId: string;
  call: Call;
};

export const VideoPlaceholder = (props: VideoPlaceholderProps) => {
  const { call, imageSrc, userId, sessionId } = props;
  const [error, setError] = useState(false);

  const placeholderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const trackType = SfuModels.TrackType.VIDEO;
    call.viewportTracker.addObject(sessionId, trackType, el);
    return () => {
      call.viewportTracker.removeObject(sessionId, trackType, el);
    };
  }, [call, sessionId]);

  return (
    <div className="str-video__participant-placeholder" ref={placeholderRef}>
      {(!imageSrc || error) && (
        <div className="str-video__placeholder--initials-fallback">
          <h2>{userId.at(0)}</h2>
        </div>
      )}
      {imageSrc && !error && (
        <>
          <img
            onError={() => setError(true)}
            alt="participant-placeholder"
            className="str-video__participant-placeholder--avatar"
            src={imageSrc}
          />
          <div className="str-video__participant-placeholder--backdrop" />
          <img
            alt="participant-placeholder-background"
            className="str-video__participant-placeholder--avatar-background"
            src={imageSrc}
          />
        </>
      )}
    </div>
  );
};
