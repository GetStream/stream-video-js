import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const UserChecked: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="15"
      height="16"
      viewBox="0 0 15 16"
      fill="none"
      className={rootClassName}
    >
      <path
        opacity="0.72"
        d="M6.5625 7.84375C7.94375 7.84375 9.0625 6.725 9.0625 5.34375C9.0625 3.9625 7.94375 2.84375 6.5625 2.84375C5.18125 2.84375 4.0625 3.9625 4.0625 5.34375C4.0625 6.725 5.18125 7.84375 6.5625 7.84375ZM6.5625 4.09375C7.25 4.09375 7.8125 4.65625 7.8125 5.34375C7.8125 6.03125 7.25 6.59375 6.5625 6.59375C5.875 6.59375 5.3125 6.03125 5.3125 5.34375C5.3125 4.65625 5.875 4.09375 6.5625 4.09375ZM2.8125 11.5938C2.9375 11.2 4.41875 10.5437 5.9125 10.3812L7.1875 9.13125C6.94375 9.10625 6.7625 9.09375 6.5625 9.09375C4.89375 9.09375 1.5625 9.93125 1.5625 11.5938V12.8438H7.1875L5.9375 11.5938H2.8125ZM12.5625 8.15625L9.35625 11.3875L8.0625 10.0875L7.1875 10.9688L9.35625 13.1562L13.4375 9.0375L12.5625 8.15625Z"
        fill="currentColor"
      />
    </svg>
  );
};
