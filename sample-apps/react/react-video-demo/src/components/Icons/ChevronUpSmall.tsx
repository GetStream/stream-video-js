import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChevronUp: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="11"
      height="12"
      viewBox="0 0 11 12"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M5.50122 3.26746C5.36426 3.26746 5.23938 3.31982 5.13867 3.42859L2.06909 6.56665C1.98047 6.65527 1.93616 6.76404 1.93616 6.89697C1.93616 7.15881 2.1416 7.36426 2.39941 7.36426C2.52832 7.36426 2.64917 7.31189 2.73779 7.22327L5.50122 4.39136L8.26465 7.22327C8.3573 7.31189 8.47412 7.36426 8.60303 7.36426C8.86487 7.36426 9.07031 7.15881 9.07031 6.89697C9.07031 6.76807 9.02197 6.65527 8.93335 6.56665L5.86377 3.42859C5.75903 3.31982 5.63818 3.26746 5.50122 3.26746Z"
        fill="currentColor"
      />
    </svg>
  );
};
