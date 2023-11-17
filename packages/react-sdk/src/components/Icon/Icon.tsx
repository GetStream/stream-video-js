import clsx from 'clsx';

export type IconProps = {
  icon: string;
  className?: string;
};

export const Icon = ({ className, icon }: IconProps) => (
  <span
    className={clsx(
      'str-video__icon',
      icon && `str-video__icon--${icon}`,
      className,
    )}
  />
);
