import { FC, useCallback } from 'react';

import ControlMenu from '../ControlMenu';
import Button from '../Button';
import ControlButton from '../ControlButton';
import { Chat, People, Options, Leave } from '../Icons';

import styles from './Footer.module.css';

export type Props = {
  call: any;
  isCallActive: boolean;
  toggleChat: () => void;
  toggleParticipants: () => void;
  showChat?: boolean;
  showParticipants?: boolean;
};

export const Panel: FC<{ className?: string }> = () => {
  return <div>Panel</div>;
};

export const Footer: FC<Props> = ({
  call,
  isCallActive,
  toggleChat,
  toggleParticipants,
  showChat,
  showParticipants,
}) => {
  const leave = useCallback(() => {
    call.leave();
  }, [call]);

  return (
    <section className={styles.footer}>
      <div>
        <ControlButton panel={Panel} prefix={() => <Options />} />
      </div>
      <div className={styles.controls}>
        <ControlMenu className={styles.controlMenu} call={call} />
        <Button
          className={styles.cancel}
          color="danger"
          shape="square"
          onClick={() => leave()}
        >
          <Leave />
        </Button>
      </div>
      <div className={styles.toggles}>
        <Button
          className={styles.chat}
          label="Chat"
          color={showChat ? 'active' : 'secondary'}
          shape="square"
          onClick={toggleChat}
        >
          <Chat />
        </Button>
        <Button
          label="Participants"
          color={showParticipants ? 'active' : 'secondary'}
          shape="square"
          onClick={toggleParticipants}
        >
          <People />
        </Button>
      </div>
    </section>
  );
};
