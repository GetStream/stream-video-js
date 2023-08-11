import { FC } from 'react';
import classnames from 'classnames';
import { StreamChat } from 'stream-chat';

import { AnimatedPanel } from '../Panel';
import Chat from '../Chat';

import type { ConnectionError } from '../../hooks/useChatClient';

import styles from './ChatPanel.module.css';

export type Props = {
  className?: string;
  isFocused?: boolean;
  channelId: string;
  chatConnectionError?: ConnectionError;
  client?: StreamChat | null;
  channelType: string;
  close?: () => void;
  fulllHeight?: boolean;
  visible: boolean;
};

export const ChatPanel: FC<Props> = ({
  isFocused,
  className,
  channelId,
  client,
  channelType,
  chatConnectionError,
  close,
  fulllHeight,
  visible,
}) => {
  const rootClassname = classnames(styles.root, className);

  return (
    <AnimatedPanel
      className={rootClassname}
      title="Chat"
      isFocused={isFocused}
      close={close}
      canCollapse
      fulllHeight={fulllHeight}
      visible={visible}
    >
      <Chat
        channelId={channelId}
        client={client}
        channelType={channelType}
        chatConnectionError={chatConnectionError}
      />
    </AnimatedPanel>
  );
};
