import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Chat: FC<Props> = ({ className }) => {
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
        d="M25 2.42188H5C3.625 2.42188 2.5 3.51172 2.5 4.84375V26.6406L7.5 21.7969H25C26.375 21.7969 27.5 20.707 27.5 19.375V4.84375C27.5 3.51172 26.375 2.42188 25 2.42188Z"
        fill="currentColor"
      />
    </svg>
  );
};
