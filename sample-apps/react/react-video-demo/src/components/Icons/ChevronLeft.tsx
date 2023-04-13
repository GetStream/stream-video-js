import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChevronLeft: FC<Props> = ({ className }) => {
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
        d="M17.5023 2.98531C17.0123 2.49531 16.2223 2.49531 15.7323 2.98531L7.42234 11.2953C7.03234 11.6853 7.03234 12.3153 7.42234 12.7053L15.7323 21.0153C16.2223 21.5053 17.0123 21.5053 17.5023 21.0153C17.9923 20.5253 17.9923 19.7353 17.5023 19.2453L10.2623 11.9953L17.5123 4.74531C17.9923 4.26531 17.9923 3.46531 17.5023 2.98531Z"
        fill="currentColor"
      />
    </svg>
  );
};
