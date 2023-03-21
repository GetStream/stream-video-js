import { ComponentProps } from 'react';

export const TextButton = ({
  children,
  ...rest
}: Omit<ComponentProps<'button'>, 'ref' | 'className'>) => {
  return (
    <button {...rest} className="str-video__text-button">
      {children}
    </button>
  );
};
