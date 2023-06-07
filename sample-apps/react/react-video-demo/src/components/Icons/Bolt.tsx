import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Bolt: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M10.1234 3.11133H14.5277L11.5915 8.98372H14.5277L9.02229 19.2604L10.1234 11.9199H6.45312L10.1234 3.11133Z"
        fill="currentColor"
      />
    </svg>
  );
};
