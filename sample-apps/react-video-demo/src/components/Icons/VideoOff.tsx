import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const VideoOff: FC<Props> = ({ className }) => {
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
        d="M26.6148 17.886V11.4802C26.6148 10.4024 25.2648 9.85752 24.4773 10.6204L21.6148 13.4056V9.16729C21.6148 8.50127 21.0523 7.95635 20.3648 7.95635H13.3523L24.4898 18.7458C25.2648 19.5087 26.6148 18.9638 26.6148 17.886ZM3.75234 3.79072C3.26484 4.26299 3.26484 5.02588 3.75234 5.49814L6.27734 7.95635H5.36484C4.67734 7.95635 4.11484 8.50127 4.11484 9.16729V21.2767C4.11484 21.9427 4.67734 22.4876 5.36484 22.4876H20.3648C20.6273 22.4876 20.8523 22.3907 21.0523 22.2696L24.1523 25.2728C24.6398 25.745 25.4273 25.745 25.9148 25.2728C26.4023 24.8005 26.4023 24.0376 25.9148 23.5653L5.51484 3.79072C5.02734 3.31846 4.23984 3.31846 3.75234 3.79072Z"
        fill="currentColor"
      />
    </svg>
  );
};
