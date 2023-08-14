import { FC } from 'react';
import classnames from 'classnames';

import Button from '../Button';

import styles from './JoinContainer.module.css';
import { logoURI } from '../../utils/constants';

export type Props = {
  className?: string;
  joinCall(): void;
  isJoiningCall?: boolean;
};

export const JoinContainer: FC<Props> = ({
  className,
  joinCall,
  isJoiningCall,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      <img src={logoURI} className={styles.logo} />
      <p className={styles.description}>
        You are about to start a private test call via Stream. Once you start
        the call, you can invite other participants
      </p>
      <Button
        className={styles.button}
        onClick={joinCall}
        color="primary"
        shape="rectangle"
      >
        {isJoiningCall ? 'Join call' : 'Start Call'}
      </Button>
    </div>
  );
};
