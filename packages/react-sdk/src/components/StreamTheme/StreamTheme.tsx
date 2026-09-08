import { ElementType, HTMLProps, PropsWithChildren } from 'react';
import clsx from 'clsx';

export type StreamThemeProps = HTMLProps<HTMLElement> & {
  as?: ElementType;
  theme?: string;
};

export const StreamTheme = ({
  as: Component = 'div',
  className,
  children,
  theme = 'str-video__theme-dark',
  ...props
}: PropsWithChildren<StreamThemeProps>) => {
  return (
    <Component {...props} className={clsx('str-video', theme, className)}>
      {children}
    </Component>
  );
};
