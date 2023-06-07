import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChevronRight: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M7.50157 21.1612C7.99157 21.6512 8.78157 21.6512 9.27157 21.1612L17.5816 12.8512C17.9716 12.4612 17.9716 11.8312 17.5816 11.4412L9.27157 3.13117C8.78157 2.64117 7.99157 2.64117 7.50157 3.13117C7.01157 3.62117 7.01157 4.41117 7.50157 4.90117L14.7416 12.1512L7.49157 19.4012C7.01157 19.8812 7.01157 20.6812 7.50157 21.1612Z"
        fill="currentColor"
      />
    </svg>
  );
};
