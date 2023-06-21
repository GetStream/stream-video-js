import { ComponentProps, CSSProperties, useState } from 'react';
import clsx from 'clsx';

export type AvatarData = {
  imageSrc?: string;
  name?: string;
  style?: CSSProperties & Record<string, string | number>;
};

export type AvatarProps = AvatarData & ComponentProps<'img'>;

export const Avatar = ({
  imageSrc,
  name,
  style,
  className,
  ...rest
}: AvatarProps) => {
  const [error, setError] = useState(false);

  return (
    <>
      {(!imageSrc || error) && name && (
        <AvatarFallback className={className} style={style} names={[name]} />
      )}
      {imageSrc && !error && (
        <img
          onError={() => setError(true)}
          alt="avatar"
          className={clsx('str-video__avatar', className)}
          src={imageSrc}
          style={style}
          {...rest}
        />
      )}
    </>
  );
};

type AvatarFallbackProps = {
  names: string[];
  className?: string;
  style?: CSSProperties & Record<string, string | number>;
};
export const AvatarFallback = ({
  className,
  names,
  style,
}: AvatarFallbackProps) => {
  return (
    <div
      className={clsx('str-video__avatar--initials-fallback', className)}
      style={style}
    >
      <div>
        {names[0][0]}
        {names[1]?.[0]}
      </div>
    </div>
  );
};
