import { FC, ReactNode } from 'react';
import classnames from 'classnames';

import styles from './Button.module.css';

export type Props = {
  className?: string;
  rounded?: boolean;
  color:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'transparent'
    | 'danger'
    | 'active';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangle' | 'square' | 'oval';
  icon?: 'left' | 'right';
  onClick(): void;
  children?: ReactNode | undefined;
  label?: string;
};

export const Button: FC<Props> = ({
  className,
  children,
  onClick,
  color,
  size = 'primary',
  shape = 'rectangle',
  icon,
  label,
}) => {
  const states = {
    [styles.primary]: color === 'primary',
    [styles.secondary]: color === 'secondary',
    [styles.danger]: color === 'danger',
    [styles.transparent]: color === 'transparent',
    [styles.active]: color === 'active',
    [styles.small]: size === 'small',
    [styles.medium]: size === 'medium',
    [styles.large]: size === 'large',
    [styles.rectangle]: shape === 'rectangle',
    [styles.square]: shape === 'square',
    [styles.oval]: shape === 'oval',
    [styles.iconLeft]: icon === 'left',
    [styles.iconRight]: icon === 'right',
  };
  const rootClassName = classnames(styles.root, states, className);

  if (label) {
    const containerClassName = classnames(styles.container, className);
    const buttonClassName = classnames(styles.root, states);

    return (
      <div className={containerClassName}>
        <button className={buttonClassName} onClick={onClick}>
          {children}
        </button>
        {label ? <span className={styles.label}>{label}</span> : null}
      </div>
    );
  }
  return (
    <button className={rootClassName} onClick={onClick}>
      {children}
    </button>
  );
};
