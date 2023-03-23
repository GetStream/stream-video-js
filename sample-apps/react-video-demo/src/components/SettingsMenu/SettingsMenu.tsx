import { FC, ReactNode, createElement } from 'react';
import classnames from 'classnames';

import styles from './SettingsMenu.module.css';

export type Props = {
  className?: string;
  title?: string;
  icon?: ReactNode;
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
          {icon}

          <h3 className={styles.heading}>{title}</h3>
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
};
