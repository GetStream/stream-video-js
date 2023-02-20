import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Signal: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M12 16L12 11"
        stroke="#006CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16L7 14"
        stroke="#006CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 16L17 8"
        stroke="#006CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
