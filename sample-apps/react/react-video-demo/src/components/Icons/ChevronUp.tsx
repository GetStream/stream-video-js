import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChevronUp: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M21.0147 17.5023C21.5047 17.0123 21.5047 16.2223 21.0147 15.7323L12.7047 7.42234C12.3147 7.03234 11.6847 7.03234 11.2947 7.42234L2.98469 15.7323C2.49469 16.2223 2.49469 17.0123 2.98469 17.5023C3.47469 17.9923 4.26469 17.9923 4.75469 17.5023L12.0047 10.2623L19.2547 17.5123C19.7347 17.9923 20.5347 17.9923 21.0147 17.5023Z"
        fill="currentColor"
      />
    </svg>
  );
};
