import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ArrowDown: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M1.15839 2.31579L4.18006 5.33746C4.63506 5.79246 5.37006 5.79246 5.82506 5.33746L8.84672 2.31579C9.58172 1.58079 9.05672 0.320794 8.01839 0.320794L1.97506 0.320794C0.936723 0.320794 0.42339 1.58079 1.15839 2.31579Z"
        fill="currentColor"
      />
    </svg>
  );
};
