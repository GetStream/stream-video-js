import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Leave: FC<Props> = ({ className }) => {
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
        d="M5.7244 19.8807L8.2244 17.9553C8.8244 17.4951 9.1744 16.7928 9.1744 16.0541V12.9057C12.9494 11.7189 17.0369 11.7068 20.8244 12.9057V16.0662C20.8244 16.8049 21.1744 17.5072 21.7744 17.9674L24.2619 19.8807C25.2619 20.6436 26.6869 20.5709 27.5869 19.699L29.1119 18.2217C30.1119 17.2529 30.1119 15.6424 29.0494 14.7342C21.0369 7.88027 8.9619 7.88027 0.949396 14.7342C-0.113104 15.6424 -0.113104 17.2529 0.886896 18.2217L2.4119 19.699C3.2994 20.5709 4.7244 20.6436 5.7244 19.8807Z"
        fill="currentColor"
      />
    </svg>
  );
};
