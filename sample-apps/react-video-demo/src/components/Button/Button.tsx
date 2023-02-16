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
  shape?: 'rectangle' | 'square' | 'oval';
  onClick(): void;
  children?: ReactNode | undefined;
  label?: string;
};

export const Button: FC<Props> = ({
  className,
  children,
  onClick,
  color,
  shape = 'rectangle',
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
