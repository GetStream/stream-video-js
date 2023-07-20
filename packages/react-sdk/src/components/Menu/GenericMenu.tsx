import { ComponentProps, PropsWithChildren } from 'react';
import clsx from 'clsx';

export type GenericMenuProps = {
  className?: string;
};

export const GenericMenu = ({
  className,
  children,
}: PropsWithChildren<GenericMenuProps>) => {
  return (
    <ul className={clsx('str-video__generic-menu', className)}>{children}</ul>
  );
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
