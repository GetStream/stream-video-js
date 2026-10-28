import { ComponentProps, RefAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { Avatar } from '../../../components/Avatar';

export type BaseVideoPlaceholderProps = {
  participant: StreamVideoParticipant;
} & RefAttributes<HTMLDivElement> &
  ComponentProps<'div'>;

export const BaseVideoPlaceholder = forwardRef<
  HTMLDivElement,
  BaseVideoPlaceholderProps
>(function DefaultVideoPlaceholder(
  { participant, className, style, children },
  ref,
) {
  const name = participant.name || participant.userId;
  return (
    <div
      className={clsx('str-video__video-placeholder', className)}
      style={style}
      ref={ref}
    >
      {(participant.image || name) && (
        <div className="str-video__video-placeholder__avatar">
          <Avatar
            size="2xl"
            showOutline
            imageSrc={participant.image}
            name={name}
          />
        </div>
      )}
      {!participant.image && !name && (
        <div className="str-video__video-placeholder__no-video-label">
          {children}
        </div>
      )}
    </div>
  );
});
