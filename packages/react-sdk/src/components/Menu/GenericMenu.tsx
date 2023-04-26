import { ComponentProps, PropsWithChildren } from 'react';

export const GenericMenu = ({ children }: PropsWithChildren) => {
  return <ul className="str-video__generic-menu">{children}</ul>;
};

export const GenericMenuButtonItem = ({
  children,
  ...rest
}: Omit<ComponentProps<'button'>, 'ref'>) => {
  return (
    <li className="str-video__generic-menu--item">
      <button {...rest}>{children}</button>
    </li>
  );
};
