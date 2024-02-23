import { ComponentProps, MouseEvent, PropsWithChildren, useRef } from 'react';

export const GenericMenu = ({
  children,
  onItemClick,
}: PropsWithChildren<{
  onItemClick?: (e: MouseEvent) => void;
}>) => {
  const ref = useRef<HTMLUListElement>(null);
  return (
    <ul
      className="str-video__generic-menu"
      ref={ref}
      onClick={(e) => {
        if (
          onItemClick &&
          e.target !== ref.current &&
          ref.current?.contains(e.target as Node)
        ) {
          onItemClick(e);
        }
      }}
    >
      {children}
    </ul>
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
