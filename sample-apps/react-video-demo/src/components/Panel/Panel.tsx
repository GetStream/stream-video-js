import { FC, ReactNode, useCallback, useState, useRef } from 'react';
import classnames from 'classnames';

import { ArrowDown } from '../Icons';

import Button from '../Button';

import styles from './Panel.module.css';

export type Props = {
  className?: string;
  title: string | ReactNode;
  isFocused?: boolean;
  canCollapse?: boolean;
  children: ReactNode | undefined;
};

export const Panel: FC<Props> = ({
  className,
  children,
  title,
  isFocused,
  canCollapse,
}) => {
  const [isOpen, setOpen] = useState(true);

  const handleCollapse = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

  const rootClassname = classnames(
    styles.root,
    {
      [styles.focused]: isFocused,
    },
    className,
  );

  const headingClassName = classnames(styles.header, {
    [styles.canCollapse]: canCollapse,
    [styles.open]: isOpen,
  });

  const arrowClassName = classnames(styles.arrow, {
    [styles.open]: !isOpen,
  });

  return (
    <div className={rootClassname}>
      <div className={headingClassName}>
        <h2 className={styles.heading}>{title}</h2>

        {canCollapse ? (
          <Button
            className={styles.toggle}
            color="secondary"
            onClick={handleCollapse}
            shape="square"
          >
            <ArrowDown className={arrowClassName} />
          </Button>
        ) : null}
      </div>
      {isOpen ? <div className={styles.content}>{children}</div> : null}
    </div>
  );
};
