import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const People: FC<Props> = ({ className }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.8375 15.8996C22.55 17.0258 23.75 18.5516 23.75 20.5859V24.2188H27.5C28.1875 24.2188 28.75 23.6738 28.75 23.0078V20.5859C28.75 17.9461 24.2875 16.384 20.8375 15.8996Z"
        fill="currentColor"
      />
      <path
        d="M11.25 14.5312C14.0114 14.5312 16.25 12.3626 16.25 9.6875C16.25 7.01237 14.0114 4.84375 11.25 4.84375C8.48858 4.84375 6.25 7.01237 6.25 9.6875C6.25 12.3626 8.48858 14.5312 11.25 14.5312Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.75 14.5312C21.5125 14.5312 23.75 12.3637 23.75 9.6875C23.75 7.01133 21.5125 4.84375 18.75 4.84375C18.1625 4.84375 17.6125 4.96484 17.0875 5.13437C18.125 6.38164 18.75 7.96797 18.75 9.6875C18.75 11.407 18.125 12.9934 17.0875 14.2406C17.6125 14.4102 18.1625 14.5312 18.75 14.5312Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.25 15.7422C7.9125 15.7422 1.25 17.3648 1.25 20.5859V23.0078C1.25 23.6738 1.8125 24.2188 2.5 24.2188H20C20.6875 24.2188 21.25 23.6738 21.25 23.0078V20.5859C21.25 17.3648 14.5875 15.7422 11.25 15.7422Z"
        fill="currentColor"
      />
    </svg>
  );
};
