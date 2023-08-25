import { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  Call,
  SfuModels,
  useCallStateHooks,
  Video,
} from '@stream-io/video-react-sdk';

import ParticipantsSlider from '../ParticipantsSlider';
import Button from '../Button';
import { Close, ShareScreen } from '../Icons';

import styles from './ScreenShareParticipants.module.css';

export type Props = {
  className?: string;
  call: Call;
};

export const ScreenShareParticipants: FC<Props> = ({ call }) => {
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(
    undefined,
  );

  const { useLocalParticipant, useParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const wrapper: any = useRef();

  useEffect(() => {
    if (wrapper) {
      const resizeObserver = new ResizeObserver((event) => {
        if (!event[0]?.contentBoxSize) {
          setWrapperHeight(event[0].contentRect.height);
        } else {
          setWrapperHeight(event[0].contentBoxSize[0].blockSize);
        }
      });

      if (wrapper) {
        resizeObserver.observe(wrapper.current);
      }
    }
  }, [wrapper]);

  const stopSharing = useCallback(async () => {
    await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  }, [call]);

  if (
    firstScreenSharingParticipant?.sessionId === localParticipant?.sessionId
  ) {
    return (
      <div className={styles.remoteView} ref={wrapper}>
        {wrapperHeight ? (
          <>
            {firstScreenSharingParticipant ? (
              <div className={styles.screenShareContainer}>
                <Video
                  className={styles.screenShare}
                  participant={firstScreenSharingParticipant}
                  videoMode="screen"
                  autoPlay
                  muted
                />
                <div className={styles.localNotification}>
                  <div className={styles.localNotificationHeading}>
                    <ShareScreen className={styles.screenShareIcon} />
                    <h2 className={styles.heading}>
                      You are presenting your screen
                    </h2>
                  </div>

                  <Button
                    className={styles.button}
                    color="danger"
                    shape="rectangle"
                    onClick={stopSharing}
                  >
                    <Close className={styles.closeIcon} />
                    <span> Stop Screen Sharing</span>
                  </Button>
                </div>
              </div>
            ) : null}

            <div className={styles.remoteParticipants}>
              <ParticipantsSlider
                call={call}
                mode="vertical"
                participants={allParticipants}
                height={wrapperHeight}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (
    firstScreenSharingParticipant?.sessionId !== localParticipant?.sessionId
  ) {
    return (
      <div className={styles.remoteView} ref={wrapper}>
        {wrapperHeight ? (
          <>
            {firstScreenSharingParticipant ? (
              <div className={styles.screenShareContainer}>
                <Video
                  className={styles.screenShare}
                  participant={firstScreenSharingParticipant}
                  videoMode="screen"
                  autoPlay
                  muted
                />
              </div>
            ) : null}

            <div className={styles.remoteParticipants}>
              <ParticipantsSlider
                call={call}
                mode="vertical"
                participants={allParticipants}
                height={wrapperHeight}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return null;
};
