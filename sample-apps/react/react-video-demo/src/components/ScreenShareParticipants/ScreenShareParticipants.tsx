import { FC, useCallback, useEffect, useState } from 'react';
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

  const { useParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapper) return;
    const resizeObserver = new ResizeObserver((event) => {
      if (!event[0]?.contentBoxSize) {
        setWrapperHeight(event[0].contentRect.height);
      } else {
        setWrapperHeight(event[0].contentBoxSize[0].blockSize);
      }
    });
    if (wrapper) {
      resizeObserver.observe(wrapper);
    }
    return () => {
      resizeObserver.unobserve(wrapper);
      resizeObserver.disconnect();
    };
  }, [wrapper]);

  const stopSharing = useCallback(async () => {
    await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  }, [call]);

  return (
    <div className={styles.remoteView} ref={setWrapper}>
      {wrapperHeight ? (
        <>
          {firstScreenSharingParticipant ? (
            <div className={styles.screenShareContainer}>
              <Video
                className={styles.screenShare}
                participant={firstScreenSharingParticipant}
                trackType="screenShareTrack"
                autoPlay
                muted
              />
              {firstScreenSharingParticipant.isLocalParticipant && (
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
                    <span>Stop Screen Sharing</span>
                  </Button>
                </div>
              )}
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
};
