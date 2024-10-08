import { ComponentProps, RefAttributes, forwardRef, useState } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';

export type BaseVideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & RefAttributes<HTMLDivElement> &
  ComponentProps<'div'>;

export const BaseVideoPlaceholder = forwardRef<
  HTMLDivElement,
  BaseVideoPlaceholderProps
>(function DefaultVideoPlaceholder({ participant, style, children }, ref) {
  const [error, setError] = useState(false);
  const name = participant.name || participant.userId;
  return (
    <div className="str-video__video-placeholder" style={style} ref={ref}>
      {(!participant.image || error) &&
        (name ? (
          <InitialsFallback name={name} />
        ) : (
          <div className="str-video__video-placeholder__no-video-label">
            {children}
          </div>
        ))}
      {participant.image && !error && (
        <img
          onError={() => setError(true)}
          alt={name}
          className="str-video__video-placeholder__avatar"
          src={participant.image}
        />
      )}
    </div>
  );
});

const InitialsFallback = (props: { name: string }) => {
  const { name } = props;
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
  return (
    <div className="str-video__video-placeholder__initials-fallback">
      {initials}
    </div>
  );
};
