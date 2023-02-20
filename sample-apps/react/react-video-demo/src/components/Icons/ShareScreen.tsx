import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ShareScreen: FC<Props> = ({ className }) => {
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
        d="M25 21.7969C26.375 21.7969 27.4875 20.707 27.4875 19.375L27.5 7.26562C27.5 5.92148 26.375 4.84375 25 4.84375H5C3.6125 4.84375 2.5 5.92148 2.5 7.26562V19.375C2.5 20.707 3.6125 21.7969 5 21.7969H0V24.2188H30V21.7969H25ZM5 19.375V7.26562H25V19.3871L5 19.375ZM16.25 11.0559C11.3875 11.7098 9.45 14.9309 8.75 18.1641C10.4875 15.8996 12.775 14.8703 16.25 14.8703V17.5223L21.25 12.9934L16.25 8.47656V11.0559Z"
        fill="currentColor"
      />
    </svg>
  );
};
