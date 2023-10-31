import clsx from 'clsx';

export type IconProps = {
  icon: string;
};

export const Icon = ({ icon }: IconProps) => (
  <span
    className={clsx('str-video__icon', icon && `str-video__icon--${icon}`)}
  />
);
