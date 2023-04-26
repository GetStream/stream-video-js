import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Record: FC<Props> = ({ className }) => {
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
        d="M15 2.42188C8.1 2.42188 2.5 7.84688 2.5 14.5312C2.5 21.2156 8.1 26.6406 15 26.6406C21.9 26.6406 27.5 21.2156 27.5 14.5312C27.5 7.84688 21.9 2.42188 15 2.42188ZM15 24.2188C9.475 24.2188 5 19.8836 5 14.5312C5 9.17891 9.475 4.84375 15 4.84375C20.525 4.84375 25 9.17891 25 14.5312C25 19.8836 20.525 24.2188 15 24.2188Z"
        fill="currentColor"
      />
      <path
        d="M15 20.5859C18.4518 20.5859 21.25 17.8752 21.25 14.5312C21.25 11.1873 18.4518 8.47656 15 8.47656C11.5482 8.47656 8.75 11.1873 8.75 14.5312C8.75 17.8752 11.5482 20.5859 15 20.5859Z"
        fill="currentColor"
      />
    </svg>
  );
};
