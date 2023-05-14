import { FC } from 'react';
import classnames from 'classnames';

import { StreamMark } from '../Icons';

import styles from './PoweredBy.module.css';

export type Props = {
  className?: string;
};

export const PoweredBy: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.branding, className);
  return (
    <div className={rootClassName}>
      <StreamMark className={styles.logo} />
      <span>Powered by Stream</span>
    </div>
  );
};
