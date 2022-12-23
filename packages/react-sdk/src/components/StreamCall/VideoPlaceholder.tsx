import { useState } from 'react';

export const VideoPlaceholder = ({
  imageSrc,
  userId,
}: {
  imageSrc?: string;
  userId: string;
}) => {
  const [error, setError] = useState(false);

  return (
    <>
      <div className="str-video__participant-placeholder">
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
    </>
  );
};
