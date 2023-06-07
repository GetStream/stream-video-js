import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const BarGraph: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M3.75 6.9H6V14.25H3.75V6.9ZM7.95 3.75H10.05V14.25H7.95V3.75ZM12.15 9.75H14.25V14.25H12.15V9.75Z"
        fill="white"
      />
    </svg>
  );
};
