import { forwardRef } from 'react';
import clsx from 'clsx';

import { Button, ButtonProps } from './Button';
import { Icon } from '../Icon';

export type IconButtonProps = Omit<ButtonProps, 'children'> & {
  icon: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButtonRender({ icon, className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        className={clsx('str-video__button--icon-only', className)}
        {...props}
      >
        <Icon icon={icon} />
      </Button>
    );
  },
);
