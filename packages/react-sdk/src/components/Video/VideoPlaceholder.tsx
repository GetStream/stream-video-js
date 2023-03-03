import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

export type VideoPlaceholderProps = {
  imageSrc?: string;
  isSpeaking?: boolean;
  name?: string | null;
};

export const VideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(({ imageSrc, isSpeaking, name }, ref) => {
  const [error, setError] = useState(false);

  return (
    <div className="str-video__participant-placeholder" ref={ref}>
      {(!imageSrc || error) &&
        (name ? (
          <div className="str-video__participant-placeholder--initials-fallback">
            <div>{name[0]}</div>
          </div>
        ) : (
          <div>Video is disabled</div>
        ))}
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
