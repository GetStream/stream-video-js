import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Download: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      className={rootClassName}
    >
      <title />

      <g>
        <path
          d="M3,12.3v7a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2v-7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />

        <g>
          <polyline
            data-name="Right"
            fill="none"
            id="Right-2"
            points="7.9 12.3 12 16.3 16.1 12.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />

          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="12"
            x2="12"
            y1="2.7"
            y2="14.2"
          />
        </g>
      </g>
    </svg>
  );
};
