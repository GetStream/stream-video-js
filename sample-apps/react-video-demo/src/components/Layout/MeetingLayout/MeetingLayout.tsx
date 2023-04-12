import { FC, ReactNode, useRef } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { StreamChat } from 'stream-chat';

import Chat from '../../Chat';

import { useModalContext } from '../../../contexts/ModalContext';
import { useBreakpoint } from '../../../hooks/useBreakpoints';

import styles from './MeetingLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  sidebar?: ReactNode;
  showParticipants?: boolean;
  showChat?: boolean;
  chatClient?: StreamChat | null;
  toggleChat?: () => void;
  callId: string;
};

export const MeetingLayout: FC<Props> = ({
  className,
  header,
  footer,
  sidebar,
  children,
  showParticipants,
  showChat,
  chatClient,
  toggleChat,
  callId,
}) => {
  const { isVisible, component, close } = useModalContext();

  const transitionRef = useRef(null);

  const breakpoint = useBreakpoint();

  const rootClassName = classnames(styles.root, className);

  const layoutContainerClassName = classnames(styles.layoutContainer, {
    [styles.showParticipants]:
      showParticipants && (breakpoint === 'xs' || breakpoint === 'sm'),
    [styles.showChat]: showChat && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  const bodyClassName = classnames(styles.body, {
    [styles.showChat]: showChat && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  return (
    <section className={rootClassName}>
      <div className={layoutContainerClassName}>
        {showParticipants &&
        (breakpoint === 'xs' || breakpoint === 'sm') ? null : (
          <div className={styles.header}>{header}</div>
        )}
        <div className={bodyClassName}>{children}</div>

        <div className={styles.footer}>{footer}</div>
        {showChat && (breakpoint === 'xs' || breakpoint === 'sm') ? (
          <Chat
            channelId={callId}
            channelType="videocall"
            client={chatClient}
          />
        ) : null}

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
      {breakpoint !== 'xs' && breakpoint !== 'sm' && (
        <div className={styles.sidebar}>{sidebar}</div>
      )}
    </section>
  );
};
