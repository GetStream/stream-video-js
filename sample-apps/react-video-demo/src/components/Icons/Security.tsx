import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Security: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      className={rootClassName}
    >
      <rect
        x="0.00390625"
        width="24"
        height="24"
        rx="6"
        fill="black"
        fillOpacity="0.85"
      />
      <path
        d="M9.84068 17.697L11.5142 18.8552C11.8001 19.0483 12.1673 19.0483 12.4529 18.8552L14.1264 17.697C16.5345 15.9984 18.0039 13.3347 18.0039 10.4781V7.85319C18.0039 7.50582 17.7591 7.19696 17.3918 7.11965L12.0039 6L6.61603 7.11937C6.24875 7.19666 6.00391 7.50552 6.00391 7.85291V10.4778C6.00391 13.3346 7.4326 16.0371 9.84068 17.697ZM9.51412 11.2114L11.0652 12.6785L14.4529 9.47434L15.6775 10.6325L11.1059 14.9948L8.33052 12.3696L9.51412 11.2114Z"
        fill="#1EB114"
      />
    </svg>
  );
};
