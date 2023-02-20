import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Search: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M11.4869 10.3615H10.9579L10.7705 10.1807C11.5739 9.24332 11.989 7.9645 11.7614 6.60533C11.4467 4.74401 9.89335 3.25763 8.01864 3.02999C5.18649 2.68183 2.80292 5.06539 3.15108 7.89755C3.37873 9.77226 4.86511 11.3256 6.72643 11.6403C8.0856 11.8679 9.36442 11.4528 10.3018 10.6494L10.4825 10.8368V11.3658L13.3281 14.2113C13.6026 14.4858 14.0512 14.4858 14.3257 14.2113C14.6002 13.9368 14.6002 13.4882 14.3257 13.2137L11.4869 10.3615ZM7.46962 10.3615C5.80246 10.3615 4.45669 9.01568 4.45669 7.34852C4.45669 5.68137 5.80246 4.33559 7.46962 4.33559C9.13677 4.33559 10.4825 5.68137 10.4825 7.34852C10.4825 9.01568 9.13677 10.3615 7.46962 10.3615Z"
        fill="currentColor"
      />
    </svg>
  );
};
