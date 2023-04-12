import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Pause: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M11.25 19.375H13.75V9.6875H11.25V19.375ZM15 2.42188C8.1 2.42188 2.5 7.84688 2.5 14.5312C2.5 21.2156 8.1 26.6406 15 26.6406C21.9 26.6406 27.5 21.2156 27.5 14.5312C27.5 7.84688 21.9 2.42188 15 2.42188ZM15 24.2188C9.4875 24.2188 5 19.8715 5 14.5312C5 9.19102 9.4875 4.84375 15 4.84375C20.5125 4.84375 25 9.19102 25 14.5312C25 19.8715 20.5125 24.2188 15 24.2188ZM16.25 19.375H18.75V9.6875H16.25V19.375Z"
        fill="currentColor"
      />
    </svg>
  );
};
