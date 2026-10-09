import { ComponentProps, RefAttributes, forwardRef } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { Avatar } from '../../../components/Avatar';

export type BaseVideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & RefAttributes<HTMLDivElement> &
  ComponentProps<'div'>;

export const BaseVideoPlaceholder = forwardRef<
  HTMLDivElement,
  BaseVideoPlaceholderProps
>(function DefaultVideoPlaceholder({ participant, style, children }, ref) {
  const name = participant.name || participant.userId;
  return (
    <div className="str-video__video-placeholder" style={style} ref={ref}>
      {(participant.image || name) && (
        <Avatar
          size="2xl"
          showOutline
          imageSrc={participant.image}
          name={name}
        />
      )}
      {!participant.image && !name && (
        <div className="str-video__video-placeholder__no-video-label">
          {children}
        </div>
      )}
    </div>
  );
});
