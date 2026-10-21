import { ElementType, HTMLProps, PropsWithChildren } from 'react';
import clsx from 'clsx';

export type StreamThemeMode = 'light' | 'dark';

export type StreamThemeProps = HTMLProps<HTMLElement> & {
  as?: ElementType;
  theme?: StreamThemeMode;
};

export const StreamTheme = ({
  as: Component = 'div',
  className,
  children,
  theme = 'dark',
  ...props
}: PropsWithChildren<StreamThemeProps>) => {
  return (
    <Component
      {...props}
      className={clsx('str-video', `str-video__theme-${theme}`, className)}
    >
      {children}
    </Component>
  );
};
