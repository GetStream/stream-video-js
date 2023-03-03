import { CSSProperties, useState } from 'react';

export type AvatarData = {
  imageSrc?: string;
  name?: string;
  style?: CSSProperties & Record<string, string | number>;
};

export type AvatarProps = AvatarData;

export const Avatar = ({ imageSrc, name, style }: AvatarProps) => {
  const [error, setError] = useState(false);

  return (
    <>
      {(!imageSrc || error) && name && (
        <AvatarFallback style={style} names={[name]} />
      )}
      {imageSrc && !error && (
        <img
          onError={() => setError(true)}
          alt="avatar"
          className="str-video__avatar"
          src={imageSrc}
          style={style}
        />
      )}
    </>
  );
};

type AvatarFallbackProps = {
  names: string[];
  style?: CSSProperties & Record<string, string | number>;
};
export const AvatarFallback = ({ names, style }: AvatarFallbackProps) => {
  return (
    <div className="str-video__avatar--initials-fallback" style={style}>
      <div>
        {names[0][0]}
        {names[1]?.[0]}
      </div>
    </div>
  );
};
