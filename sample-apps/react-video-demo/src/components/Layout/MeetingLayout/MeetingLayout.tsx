import { FC, ReactNode } from 'react';
import classnames from 'classnames';

import styles from './MeetingLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  sidebar: ReactNode;
};

export const MeetingLayout: FC<Props> = ({
  className,
  header,
  footer,
  sidebar,
  children,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <section className={rootClassName}>
      <div className={styles.layoutContainer}>
        <div className={styles.header}>{header}</div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>{footer}</div>
      </div>
      <div className={styles.sidebar}>{sidebar}</div>
    </section>
  );
};
