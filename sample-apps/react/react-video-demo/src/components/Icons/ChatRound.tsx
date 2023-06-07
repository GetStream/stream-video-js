import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const ChatRound: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="66"
      height="66"
      viewBox="0 0 66 66"
      fill="none"
      className={rootClassName}
    >
      <g clipPath="url(#clip0_8025_33033)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.6301 45.2165L56.2927 42.8337C58.8985 39.0989 60.3928 34.7084 60.3928 30.0096C60.3928 16.763 48.3528 5.64774 33.0037 5.64774C17.6545 5.64774 5.61454 16.763 5.61454 30.0096C5.61454 43.256 17.6546 54.3714 33.0037 54.3714C34.9288 54.3714 36.8048 54.1949 38.6136 53.8599L39.5774 53.6814L59.1738 57.0653L54.6301 45.2165ZM62.0294 63.1173L39.6112 59.2461C37.4739 59.642 35.2639 59.8492 33.0037 59.8492C15.2264 59.8492 0.136719 46.8457 0.136719 30.0096C0.136719 13.1732 15.2264 0.169922 33.0037 0.169922C50.781 0.169922 65.8706 13.1732 65.8706 30.0096C65.8706 35.9026 63.9893 41.3758 60.7851 45.9681L65.6494 58.653C66.076 59.766 65.8768 61.0245 65.1278 61.9486C64.3788 62.8723 63.1955 63.3186 62.0294 63.1173Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_8025_33033">
          <rect
            width="65.7339"
            height="65.7339"
            fill="currentColor"
            transform="translate(0.136719 0.169922)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
