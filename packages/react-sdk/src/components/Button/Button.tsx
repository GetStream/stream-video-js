import { ComponentPropsWithoutRef, forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export type ButtonAppearance = 'solid' | 'outline' | 'ghost';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  active?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function ButtonRender(
    {
      variant = 'primary',
      appearance = 'solid',
      size = 'md',
      active,
      className,
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'str-video__button',
          `str-video__button--${variant}`,
          `str-video__button--${appearance}`,
          `str-video__button--size-${size}`,
          className,
        )}
        {...rest}
        aria-pressed={active ?? rest['aria-pressed']}
      >
        {children}
      </button>
    );
  },
);
