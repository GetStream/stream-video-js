import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ArrowRightIcon: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 27 27"
      fill="none"
      className={rootClassName}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.73828 12.3025H13.1213V7.99609L18.5043 13.3791L13.1213 18.7621V14.4557H7.73828V12.3025Z"
        fill="currentColor"
      />
    </svg>
  );
};
