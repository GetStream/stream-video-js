import { FC, ReactNode, useRef } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { StreamChat } from 'stream-chat';

import Chat from '../../Chat';

import { useModalContext } from '../../../contexts/ModalContext';
import {
  PANEL_VISIBILITY,
  usePanelContext,
} from '../../../contexts/PanelContext';

import { useBreakpoint } from '../../../hooks/useBreakpoints';

import type { ConnectionError } from 'src/hooks/useChatClient';

import styles from './MeetingLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  sidebar?: ReactNode;
  chatClient?: StreamChat | null;
  chatConnectionError?: ConnectionError;
  callId: string;
};

export const MeetingLayout: FC<Props> = ({
  className,
  header,
  footer,
  sidebar,
  children,
  chatClient,
  chatConnectionError,
  callId,
}) => {
  const { showModal, modalElement, closeModal } = useModalContext();
  const { chatPanelVisibility, participantsPanelVisibility, toggleHide } =
    usePanelContext();

  const transitionRef = useRef(null);
  const breakpoint = useBreakpoint();
  const rootClassName = classnames(styles.root, className);

  const layoutContainerClassName = classnames(styles.layoutContainer, {
    [styles.showParticipants]:
      participantsPanelVisibility &&
      (breakpoint === 'xs' || breakpoint === 'sm'),
    [styles.showChat]:
      chatPanelVisibility && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  const bodyClassName = classnames(styles.body, {
    [styles.showChat]:
      chatPanelVisibility && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  return (
    <section className={rootClassName}>
      <div className={layoutContainerClassName}>
        {header}
        {chatPanelVisibility === PANEL_VISIBILITY.expanded &&
        (breakpoint === 'xs' || breakpoint === 'sm') ? (
          <div className={styles.backdrop} onClick={() => toggleHide('chat')} />
        ) : null}
        <div className={bodyClassName}>{children}</div>

        <div className={styles.footer}>{footer}</div>

        {chatPanelVisibility === PANEL_VISIBILITY.expanded &&
        (breakpoint === 'xs' || breakpoint === 'sm') ? (
          <Chat
            channelId={callId}
            channelType="videocall"
            client={chatClient}
            chatConnectionError={chatConnectionError}
          />
        ) : null}

        <CSSTransition
          nodeRef={transitionRef}
          in={showModal}
          timeout={500}
          classNames={{
            enterActive: styles['animation-enter'],
            enterDone: styles['animation-enter-active'],
            exitActive: styles['animation-exit'],
            exitDone: styles['animation-exit-active'],
          }}
        >
          <div ref={transitionRef} className={styles.modals}>
            <div className={styles.modal}>{modalElement}</div>

            <div className={styles.space}></div>
            {showModal ? (
              <div className={styles.backdrop} onClick={closeModal} />
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
