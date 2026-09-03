import { forwardRef } from 'react';
import clsx from 'clsx';

import { Button, ButtonProps } from './Button';
import { Icon } from '../Icon';

export type IconButtonProps = Omit<ButtonProps, 'children'> & {
  icon: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButtonRender({ icon, onClick, className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        className={clsx('str-video__button--icon-only', className)}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
        }}
        {...props}
      >
        <Icon icon={icon} />
      </Button>
    );
  },
);
