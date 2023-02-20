import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChevronDown: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M0.985311 1.07188C0.495312 1.56188 0.495312 2.35188 0.985311 2.84188L9.29531 11.1519C9.68531 11.5419 10.3153 11.5419 10.7053 11.1519L19.0153 2.84188C19.5053 2.35188 19.5053 1.56188 19.0153 1.07188C18.5253 0.581885 17.7353 0.581885 17.2453 1.07188L9.99531 8.31188L2.74531 1.06188C2.26531 0.581883 1.46531 0.581883 0.985311 1.07188Z"
        fill="currentColor"
      />
    </svg>
  );
};
