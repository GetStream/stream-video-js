import { FC, ReactNode, createElement } from 'react';
import classnames from 'classnames';

import styles from './SettingsMenu.module.css';

export type Props = {
  className?: string;
  title?: string;
  icon?: FC<{ className: string }>;
  children?: ReactNode | undefined;
};

export const SettingsMenu: FC<Props> = ({
  className,
  title,
  icon,
  children,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      {title ? (
        <div className={styles.header}>
          {icon && createElement(icon, { className: styles.prefix })}

          <h3>{title}</h3>
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
};
