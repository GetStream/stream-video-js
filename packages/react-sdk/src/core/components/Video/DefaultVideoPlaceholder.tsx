import { ComponentPropsWithRef, forwardRef, useState } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import type { StreamVideoParticipant } from '@stream-io/video-client';

export type VideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & ComponentPropsWithRef<'div'>;

export const DefaultVideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(({ participant, style }, ref) => {
  const { t } = useI18n();
  const [error, setError] = useState(false);
  const name = participant.name || participant.userId;
  return (
    <div className="str-video__video-placeholder" style={style} ref={ref}>
      {(!participant.image || error) &&
        (name ? (
          <div className="str-video__video-placeholder__initials-fallback">
            <div>{name[0]}</div>
          </div>
        ) : (
          <div>{t('Video is disabled')}</div>
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
