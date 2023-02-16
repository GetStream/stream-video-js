import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Options: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      className={rootClassName}
    >
      <circle cx="4" cy="12.5312" r="2.5" fill="currentColor" />
      <circle cx="12.5" cy="12.5312" r="2.5" fill="currentColor" />
      <circle cx="21" cy="12.5312" r="2.5" fill="currentColor" />
    </svg>
  );
};
