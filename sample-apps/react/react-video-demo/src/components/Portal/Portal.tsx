import { FC, useRef, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

import styles from './Portal.module.css';

export type Props = {
  portalId?: any;
  className?: string;
  children?: ReactNode | undefined;
  selector: string;
};

export const Portal: FC<Props> = ({ className, children, selector }) => {
  const ref: any = useRef();

  const rootClassName = classNames(styles.root, className);

  const element = useMemo(() => {
    return document?.querySelector(`#${selector}`);
  }, [selector]);

  if (ref && element) {
    return createPortal(
      <div ref={ref} className={rootClassName}>
        {children}
      </div>,
      element,
    );
  }

  return null;
};
