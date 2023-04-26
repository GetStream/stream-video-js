import { useCallback, useEffect, useState } from 'react';
import {
  ChatAutoComplete,
  CooldownTimer,
  EmojiPicker,
  useMessageInputContext,
} from 'stream-chat-react';
import classnames from 'classnames';

import {
  Bolt,
  Attachment,
  Latency as GiphyIcon,
  People as GiphySearch,
  Send,
} from '../Icons';

// import { useGiphyContext } from '../../contexts/GiphyContext';

import styles from './ChatInput.module.css';

export const ChatInput = () => {
  const {
    closeCommandsList,
    cooldownInterval,
    cooldownRemaining,
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openCommandsList,
    openEmojiPicker,
    setCooldownRemaining,
    text,
  } = useMessageInputContext();
  const [giphyState, setGiphyState] = useState<boolean>();

  // const { giphyState, setGiphyState } = useGiphyContext();

  const [commandsOpen, setCommandsOpen] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      closeCommandsList();
      setCommandsOpen(false);
    };

    if (commandsOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [commandsOpen]); // eslint-disable-line

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward';

      if (text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && text.startsWith('/giphy') && !numberOfUploads) {
        event.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      handleChange(event);
    },
    [text, giphyState, numberOfUploads], // eslint-disable-line
  );

  const handleCommandsClick = () => {
    openCommandsList();
    setGiphyState(false);
    setCommandsOpen(true);
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Attachment className={styles.attachment} />
        <div onClick={handleCommandsClick}>
          <Bolt className={styles.bolt} />
        </div>
        <div className={styles.input}>
          <ChatAutoComplete onChange={onChange} placeholder="Send a message" />
        </div>

        {giphyState && <GiphySearch />}

        {/* <>
          <div
            className={classnames(styles.commands, {
              [styles.cooldown]: cooldownRemaining,
            })}
            onClick={cooldownRemaining ? () => null : handleCommandsClick}
            role="button"
          ></div>
        </> */}
      </div>
      <button
        className={classnames(styles.button, {
          [styles.text]: text,
          [styles.cooldown]: cooldownRemaining,
        })}
        disabled={!text}
        onClick={handleSubmit}
      >
        <Send className={styles.send} />
      </button>
    </div>
  );
};
