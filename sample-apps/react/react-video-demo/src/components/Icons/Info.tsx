import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Info: FC<Props> = ({ className }) => {
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
        d="M11.5 15H13.5V17H11.5V15ZM11.5 7H13.5V13H11.5V7ZM12.49 2C6.97 2 2.5 6.48 2.5 12C2.5 17.52 6.97 22 12.49 22C18.02 22 22.5 17.52 22.5 12C22.5 6.48 18.02 2 12.49 2ZM12.5 20C8.08 20 4.5 16.42 4.5 12C4.5 7.58 8.08 4 12.5 4C16.92 4 20.5 7.58 20.5 12C20.5 16.42 16.92 20 12.5 20Z"
        fill="currentColor"
      />
    </svg>
  );
};
