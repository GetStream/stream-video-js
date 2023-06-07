import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Feedback: FC<Props> = ({ className }) => {
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
        d="M4.5 4H20.5V16H5.67L4.5 17.17V4ZM4.5 2C3.4 2 2.51 2.9 2.51 4L2.5 22L6.5 18H20.5C21.6 18 22.5 17.1 22.5 16V4C22.5 2.9 21.6 2 20.5 2H4.5ZM6.5 12H14.5V14H6.5V12ZM6.5 9H18.5V11H6.5V9ZM6.5 6H18.5V8H6.5V6Z"
        fill="currentColor"
      />
    </svg>
  );
};
