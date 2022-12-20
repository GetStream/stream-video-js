import { ComponentProps } from 'react';

export const ParticipantPlaceholder = ({
  className,
  imageSrc,
}: Pick<ComponentProps<'div'>, 'className'> & {
  imageSrc?: string;
}) => {
  return (
    <div className={className}>
      {imageSrc && (
        <>
          <img
            alt="participant-placeholder"
            className="rmc__participant-placeholder--avatar"
            src={imageSrc}
          />
          <div className="rmc__participant-placeholder--backdrop" />
          <img
            alt="participant-placeholder-background"
            className="rmc__participant-placeholder--avatar-background"
            src={imageSrc}
          />
        </>
      )}
    </div>
  );
};
