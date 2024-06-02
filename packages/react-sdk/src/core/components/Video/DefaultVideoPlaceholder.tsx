import { ComponentProps, RefAttributes, forwardRef, useState } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import type { StreamVideoParticipant } from '@stream-io/video-client';

export type VideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & RefAttributes<HTMLDivElement> &
  ComponentProps<'div'>;

export const DefaultVideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(function DefaultVideoPlaceholder({ participant, style }, ref) {
  const { t } = useI18n();
  const [error, setError] = useState(false);
  const name = participant.name || participant.userId;
  return (
    <div className="str-video__video-placeholder" style={style} ref={ref}>
      {(!participant.image || error) &&
        (name ? (
          <InitialsFallback name={name} />
        ) : (
          <div className="str-video__video-placeholder__no-video-label">
            {t('Video is disabled')}
          </div>
        ))}
      {participant.image && !error && (
        <img
          onError={() => setError(true)}
          alt="video-placeholder"
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
