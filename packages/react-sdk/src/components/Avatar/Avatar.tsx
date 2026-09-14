import { ComponentProps, CSSProperties, useState } from 'react';
import clsx from 'clsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type AvatarData = {
  imageSrc?: string;
  name?: string;
  style?: CSSProperties & Record<string, string | number>;
};

export type AvatarVariantProps = {
  size?: AvatarSize;
  showOutline?: boolean;
};

export type AvatarProps = AvatarData &
  ComponentProps<'img'> &
  AvatarVariantProps;

const variantClasses = ({ size = 'md', showOutline }: AvatarVariantProps) => [
  `str-video__avatar--size-${size}`,
  showOutline && 'str-video__avatar--outlined',
];

export const Avatar = ({
  imageSrc,
  name,
  style,
  className,
  size = 'md',
  showOutline,
  ...rest
}: AvatarProps) => {
  const [error, setError] = useState(false);

  if (!imageSrc || error) {
    return name ? (
      <AvatarFallback
        className={className}
        style={style}
        names={name.split(/\s+/).filter(Boolean)}
        size={size}
        showOutline={showOutline}
      />
    ) : null;
  }

  return (
    <img
      onError={() => setError(true)}
      alt="avatar"
      className={clsx(
        'str-video__avatar',
        variantClasses({ size, showOutline }),
        className,
      )}
      src={imageSrc}
      style={style}
      {...rest}
    />
  );
};

type AvatarFallbackProps = {
  names: string[];
  className?: string;
  style?: CSSProperties & Record<string, string | number>;
} & AvatarVariantProps;

export const AvatarFallback = ({
  className,
  names,
  style,
  size = 'md',
  showOutline,
}: AvatarFallbackProps) => {
  return (
    <div
      className={clsx(
        'str-video__avatar--initials-fallback',
        variantClasses({ size, showOutline }),
        className,
      )}
      style={style}
    >
      <div>
        {names[0]?.[0]}
        {names[1]?.[0]}
      </div>
    </div>
  );
};
