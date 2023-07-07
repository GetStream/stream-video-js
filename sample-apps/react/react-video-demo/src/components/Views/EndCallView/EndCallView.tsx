import { FC } from 'react';
import classnames from 'classnames';

import Button from '../../Button';
import Feedback from '../../Feedback';

import styles from './EndCallView.module.css';

export type Props = {
  className?: string;
};

export const EndCallView: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);

  return (
    <div className={rootClassName}>
      <div className={styles.panel}>
        <img
          className={styles.image}
          src={`${import.meta.env.BASE_URL}images/end-call.png`}
        />
        <h1 className={styles.heading}>Stream Video Calling</h1>
        <p className={styles.description}>
          Build in-app audio rooms, video calling and livestreaming experiences
          with all the features and scalability your users demand.
        </p>
        <div className={styles.ctas}>
          <Button
            className={styles.cta}
            color="primary"
            shape="oval"
            onClick={() => {
              window.location.href = '/video/#contact';
            }}
          >
            TALK TO AN EXPERT
          </Button>
          <Button
            className={styles.cta}
            color="primary"
            shape="oval"
            onClick={() => {
              window.location.href = '/video/sdk/';
            }}
          >
            SDK Tutorials
          </Button>
        </div>
        <Feedback className={styles.feedback} inMeeting={false} />
      </div>
    </div>
  );
};
