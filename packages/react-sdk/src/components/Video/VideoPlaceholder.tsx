import { ComponentProps, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { StreamVideoParticipant } from '@stream-io/video-client';

export type VideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & ComponentProps<'div'>;

export const VideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(({ participant, style }, ref) => {
  const [error, setError] = useState(false);

  const name = participant?.name || participant?.userId;

  return (
    <div className="str-video__participant-placeholder" style={style} ref={ref}>
      {(!participant.image || error) &&
        (name ? (
          <div className="str-video__participant-placeholder--initials-fallback">
            <div>{name[0]}</div>
          </div>
        ) : (
          <div>Video is disabled</div>
        ))}
      {participant.image && !error && (
        <img
          onError={() => setError(true)}
          alt="participant-placeholder"
          className={clsx('str-video__participant-placeholder--avatar', {
            'str-video__participant-placeholder--avatar-speaking':
              participant.isSpeaking,
          })}
          src={participant.image}
        />
      )}
    </div>
  );
});
