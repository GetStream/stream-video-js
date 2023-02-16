import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Video: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="36"
      height="35"
      viewBox="0 0 36 35"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M25.4427 15.2792V10.2336C25.4427 9.44071 24.7731 8.79199 23.9546 8.79199H6.09747C5.27902 8.79199 4.60938 9.44071 4.60938 10.2336V24.6495C4.60938 25.4424 5.27902 26.0911 6.09747 26.0911H23.9546C24.7731 26.0911 25.4427 25.4424 25.4427 24.6495V19.6039L28.8505 22.9052C29.788 23.8134 31.3951 23.1647 31.3951 21.8816V12.987C31.3951 11.704 29.788 11.0553 28.8505 11.9635L25.4427 15.2792Z"
        fill="currentColor"
      />
    </svg>
  );
};
