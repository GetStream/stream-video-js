import { FC, ReactNode, useRef } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';

import { useModalContext } from '../../../contexts/ModalContext';

import styles from './MeetingLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  sidebar?: ReactNode;
};

export const MeetingLayout: FC<Props> = ({
  className,
  header,
  footer,
  sidebar,
  children,
}) => {
  const rootClassName = classnames(styles.root, className);
  const { isVisible, component, close } = useModalContext();

  const transitionRef = useRef(null);

  return (
    <section className={rootClassName}>
      <div className={styles.layoutContainer}>
        <div className={styles.header}>{header}</div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>{footer}</div>
        <CSSTransition
          nodeRef={transitionRef}
          in={isVisible}
          timeout={500}
          classNames={{
            enterActive: styles['animation-enter'],
            enterDone: styles['animation-enter-active'],
            exitActive: styles['animation-exit'],
            exitDone: styles['animation-exit-active'],
          }}
        >
          <div ref={transitionRef} className={styles.modals}>
            <div className={styles.modal}>{component}</div>

            <div className={styles.space}></div>
            {isVisible ? (
              <div className={styles.backdrop} onClick={() => close()} />
            ) : null}
          </div>
        </CSSTransition>
      </div>
      <div className={styles.sidebar}>{sidebar}</div>
    </section>
  );
};
