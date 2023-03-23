import { FC, useCallback, useRef, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Call, SfuModels } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useParticipants,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import { ParticipantBox, Video } from '@stream-io/video-react-sdk';

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

  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const wrapper: any = useRef();

  useEffect(() => {
    if (wrapper) {
      const resizeObserver = new ResizeObserver((event) => {
        setWrapperHeight(event[0].contentBoxSize[0].blockSize);
      });

      if (wrapper) {
        resizeObserver.observe(wrapper.current);
      }
    }
  }, [wrapper]);

  const stopSharing = useCallback(async () => {
    await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  }, [call]);

  const localViewClassNames = classnames(styles.localView, {
    [styles.hasRemoteParticipants]: remoteParticipants.length > 0,
  });

  console.log(wrapperHeight);

  if (
    firstScreenSharingParticipant?.sessionId === localParticipant?.sessionId
  ) {
    return (
      <div className={localViewClassNames} ref={wrapper}>
        <div className={styles.localContainer}>
          <div className={styles.localNotification}>
            <ShareScreen className={styles.screenShareIcon} />
            <h2 className={styles.heading}>You are presenting your screen</h2>

            <Button
              className={styles.button}
              color="danger"
              shape="rectangle"
              onClick={stopSharing}
            >
              <Close className={styles.closeIcon} />
              Stop Screen Sharing
            </Button>
          </div>
          <div className={styles.localParticipant}>
            {localParticipant && (
              <ParticipantBox
                participant={localParticipant}
                call={call}
                sinkId={localParticipant.audioOutputDeviceId}
                isMuted
              />
            )}
          </div>
        </div>
        {remoteParticipants.length > 0 ? (
          <div className={styles.remoteParticipants}>
            <ParticipantsSlider
              call={call}
              mode="horizontal"
              participants={remoteParticipants}
            />
          </div>
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
                  call={call}
                  kind="screen"
                  autoPlay
                  muted
                />
              </div>
            ) : null}

            <div className={styles.remoteParticipants}>
              <ParticipantsSlider
                call={call}
                mode="vertical"
                participants={remoteParticipants}
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
