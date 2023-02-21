import { useState } from 'react';
import { clsx } from 'clsx';

// X todo: reconcile class names

export const VideoPlaceholder = ({
  imageSrc,
  userId,
  isSpeaking,
}: {
  imageSrc?: string;
  userId: string;
  isSpeaking: boolean;
}) => {
  const [error, setError] = useState(false);

  return (
    <>
      <div className="str-video__participant-placeholder">
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
    </>
  );
};
