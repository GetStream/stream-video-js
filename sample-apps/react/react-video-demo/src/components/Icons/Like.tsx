import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Like: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg viewBox="0 0 122.88 113.41" className={rootClassName}>
      <path
        fill="currentColor"
        d="M4.29,47.64h19.3A4.31,4.31,0,0,1,27.88,52V109.1a4.31,4.31,0,0,1-4.29,4.31H4.29A4.31,4.31,0,0,1,0,109.1V52a4.31,4.31,0,0,1,4.29-4.31ZM59,4.77c2.27-11.48,21.07-.91,22.31,17.6A79.82,79.82,0,0,1,79.68,42h26.87c11.17.44,20.92,8.44,14,21.58,1.57,5.72,1.81,12.44-2.45,15.09.53,9-2,14.64-6.65,19.06-.31,4.52-1.27,8.53-3.45,11.62-3.61,5.09-6.54,3.88-12.22,3.88H50.45c-7.19,0-11.11-2-15.81-7.88V54.81C48.16,51.16,55.35,32.66,59,20.51V4.77Z"
      />
    </svg>
  );
};
