import { FC, ComponentProps } from 'react';
import { ArrowRightIcon } from '../Icons';

import type { Message } from 'stream-chat';

export type Props = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message>,
  ) => void;
} & ComponentProps<'button'>;

export const ChatSendButton: FC<Props> = ({ sendMessage, ...rest }) => {
  return (
    <div className="str-chat__send-button-container">
      <button
        aria-label="ArrowRightIcon"
        className="str-chat__send-button"
        data-testid="send-button"
        onClick={sendMessage}
        type="button"
        {...rest}
      >
        <ArrowRightIcon />
      </button>
    </div>
  );
};
