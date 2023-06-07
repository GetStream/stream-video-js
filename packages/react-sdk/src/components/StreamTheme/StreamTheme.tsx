import { ElementType, HTMLProps, PropsWithChildren } from 'react';
import clsx from 'clsx';

export type StreamThemeProps = HTMLProps<HTMLElement> & {
  as?: ElementType;
};

export const StreamTheme = ({
  as: Component = 'div',
  className,
  children,
  ...props
}: PropsWithChildren<StreamThemeProps>) => {
  return (
    <Component {...props} className={clsx('str-video', className)}>
      {children}
    </Component>
  );
};
