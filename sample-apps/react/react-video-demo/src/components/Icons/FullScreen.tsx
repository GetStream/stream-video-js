import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const FullScreen: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M21.5 11V3H13.5L16.79 6.29L6.79 16.29L3.5 13V21H11.5L8.21 17.71L18.21 7.71L21.5 11Z"
        fill="currentColor"
      />
    </svg>
  );
};
