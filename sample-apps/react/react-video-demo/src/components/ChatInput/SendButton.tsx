import React from 'react';
import { ArrowRightIcon } from '../Icons';

import type { Message } from 'stream-chat';

type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message>,
  ) => void;
} & React.ComponentProps<'button'>;

export const SendButton = ({ sendMessage, ...rest }: SendButtonProps) => {
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
