import { useState } from 'react';

export type VideoPlaceholderProps = {
  imageSrc?: string;
  name?: string;
};

export const VideoPlaceholder = ({ imageSrc, name }: VideoPlaceholderProps) => {
  const [error, setError] = useState(false);

  return (
    <>
      <div className="str-video__participant-placeholder">
        {(!imageSrc || error) &&
          (name ? (
            <div className="str-video__participant-placeholder--initials-fallback">
              <div>{name[0]}</div>
            </div>
          ) : (
            <div>Video is disabled</div>
          ))}
        {imageSrc && !error && (
          <>
            <img
              onError={() => setError(true)}
              alt="participant-placeholder"
              className="str-video__participant-placeholder--avatar"
              src={imageSrc}
            />
            {/* the backdrop image makes everything so heavy */}
            {/* TODO: rethink the backdrop */}
            {/*<div className="str-video__participant-placeholder--backdrop" />*/}
            {/*<img*/}
            {/*  alt="participant-placeholder-background"*/}
            {/*  className="str-video__participant-placeholder--avatar-background"*/}
            {/*  src={imageSrc}*/}
            {/*/>*/}
          </>
        )}
      </div>
    </>
  );
};
