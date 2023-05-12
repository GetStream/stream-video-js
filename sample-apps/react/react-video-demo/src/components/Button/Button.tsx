import { FC, ReactNode } from 'react';
import classnames from 'classnames';

import styles from './Button.module.css';

export type Props = {
  className?: string;
  rounded?: boolean;
  type?: any;
  color:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'transparent'
    | 'danger'
    | 'active';
  shape?: 'rectangle' | 'square' | 'oval';
  onClick?(): void;
  onMouseEnter?(): void;
  onMouseLeave?(): void;
  children?: ReactNode | undefined;
  label?: string;
  disabled?: boolean;
};

export const Button: FC<Props> = ({
  className,
  type = 'button',
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  color,
  shape = 'rectangle',
  disabled = false,
  label,
}) => {
  const states = {
    [styles?.[color]]: color,
    [styles?.[shape]]: shape,
  };
  const rootClassName = classnames(styles.root, states, className);

  if (label) {
    const containerClassName = classnames(styles.container, className);
    const buttonClassName = classnames(styles.root, states);

    return (
      <div className={containerClassName}>
        <button
          className={buttonClassName}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </button>
        {label ? <span className={styles.label}>{label}</span> : null}
      </div>
    );
  }
  return (
    <button
      className={rootClassName}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
