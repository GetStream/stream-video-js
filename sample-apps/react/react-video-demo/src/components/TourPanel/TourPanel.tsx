import { FC } from 'react';
import classnames from 'classnames';

import { Close } from '../Icons';
import Button from '../Button';

import styles from './TourPanel.module.css';

export type Props = {
  className?: string;
  header?: string;
  explanation?: string;
  current: number;
  total: number;
  close(): void;
  next(): void;
};

export const TourPanel: FC<Props> = ({
  className,
  header,
  explanation,
  total,
  current,
  close,
  next,
}) => {
  const rootClassName = classnames(
    styles.root,
    {
      [styles.odd]: current % 2 !== 0,
      [styles.even]: current % 2 === 0,
    },
    className,
  );
  return (
    <div className={rootClassName}>
      <div className={styles.heading}>
        <h2 className={styles.header}>{header}</h2>
        <Button
          shape="square"
          className={styles.close}
          color="transparent"
          onClick={close}
        >
          <Close className={styles.closeIcon} />
        </Button>
      </div>
      <p className={styles.explanation}>{explanation}</p>
      <div className={styles.footer}>
        <div className={styles.amount}>
          {current < 10 ? `0${current}` : current} of{' '}
          {total < 10 ? `0${total}` : total}{' '}
        </div>
        {current === total ? (
          <div className={styles.next} onClick={close}>
            Got it
          </div>
        ) : (
          <div className={styles.next} onClick={next}>
            Next →
          </div>
        )}
      </div>
    </div>
  );
};
