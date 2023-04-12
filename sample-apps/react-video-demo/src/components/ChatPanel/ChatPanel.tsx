import { FC } from 'react';
import classnames from 'classnames';
import { StreamChat } from 'stream-chat';

import Panel from '../Panel';
import Chat from '../Chat';

import styles from './ChatPanel.module.css';

export type Props = {
  className?: string;
  isFocused?: boolean;
  channelId: string;
  client?: StreamChat | null;
  channelType: string;
  close?: () => void;
};

export const ChatPanel: FC<Props> = ({
  isFocused,
  className,
  channelId,
  client,
  channelType,
  close,
}) => {
  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
      title="Chat"
      isFocused={isFocused}
      close={close}
      canCollapse
    >
      <Chat channelId={channelId} client={client} channelType={channelType} />
    </Panel>
  );
};
