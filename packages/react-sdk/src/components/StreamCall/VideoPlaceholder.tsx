import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
// x todo: reconcile
export type VideoPlaceholderProps = {
  imageSrc?: string;
  userId: string;
  isSpeaking: boolean;
};

export const VideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(({ imageSrc, userId, isSpeaking }, ref) => {
  const [error, setError] = useState(false);
  return (
    <div className="str-video__participant-placeholder" ref={ref}>
      {(!imageSrc || error) && (
        <div className="str-video__participant-placeholder--initials-fallback">
          <h2>{userId.at(0)}</h2>
        </div>
      )}
      {imageSrc && !error && (
        <img
          onError={() => setError(true)}
          alt="participant-placeholder"
          className={clsx('str-video__participant-placeholder--avatar', {
            'str-video__participant-placeholder--avatar-speaking': isSpeaking,
          })}
          src={imageSrc}
        />
      )}
    </div>
  );
});
