import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Close: FC<Props> = ({ className }) => {
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
        d="M12.7005 4.30714C12.4405 4.04714 12.0205 4.04714 11.7605 4.30714L8.50047 7.56047L5.24047 4.30047C4.98047 4.04047 4.56047 4.04047 4.30047 4.30047C4.04047 4.56047 4.04047 4.98047 4.30047 5.24047L7.56047 8.50047L4.30047 11.7605C4.04047 12.0205 4.04047 12.4405 4.30047 12.7005C4.56047 12.9605 4.98047 12.9605 5.24047 12.7005L8.50047 9.44047L11.7605 12.7005C12.0205 12.9605 12.4405 12.9605 12.7005 12.7005C12.9605 12.4405 12.9605 12.0205 12.7005 11.7605L9.44047 8.50047L12.7005 5.24047C12.9538 4.98714 12.9538 4.56047 12.7005 4.30714Z"
        fill="currentColor"
      />
    </svg>
  );
};
